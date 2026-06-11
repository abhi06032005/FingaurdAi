import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import News from '../models/News';

// Define custom field types for the parser
interface CustomItem {
  source?: string;
  description?: string;
}

const parser: Parser<any, CustomItem> = new Parser({
  customFields: {
    item: ['source', 'description']
  }
});

// Categories mapping
const CATEGORIES: { [key: string]: string } = {
  'indian-market': 'https://news.google.com/rss/search?q=Indian+stock+market',
  'ipo': 'https://news.google.com/rss/search?q=IPO+India',
  'global': 'https://news.google.com/rss/search?q=Global+Stock+Market',
  'earnings': 'https://news.google.com/rss/search?q=India+Quarterly+Results'
};

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

/**
 * Strips the publication source suffix from the title if present
 */
function cleanArticleTitle(title: string, source?: string): string {
  let cleanTitle = title || '';
  if (source && cleanTitle.endsWith(` - ${source}`)) {
    cleanTitle = cleanTitle.substring(0, cleanTitle.length - ` - ${source}`.length);
  } else {
    const lastHyphenIndex = cleanTitle.lastIndexOf(' - ');
    if (lastHyphenIndex !== -1) {
      cleanTitle = cleanTitle.substring(0, lastHyphenIndex);
    }
  }
  return cleanTitle.trim();
}

/**
 * Resolves a Google News redirect URL to the actual publisher article URL
 * using Google's internal batchexecute/Fbv4je RPC endpoint.
 *
 * Steps:
 * 1. Fetch the Google News article page to extract the c-wiz[data-p] attribute
 * 2. Parse data-p to build the garturlreq payload
 * 3. POST to /_/DotsSplashUi/data/batchexecute to get the real URL
 */
async function resolveGoogleNewsUrl(googleNewsLink: string): Promise<string | null> {
  try {
    // Step 1: Fetch the redirect page to extract session params
    const pageRes = await axios.get(googleNewsLink, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 8000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(pageRes.data);
    const cwiz = $('c-wiz[data-p]');
    if (!cwiz.length) {
      return null;
    }

    const dataP = cwiz.attr('data-p');
    if (!dataP) return null;

    // Step 2: Parse data-p — replace the %.@. prefix with ["garturlreq", to form valid JSON
    const obj = JSON.parse(dataP.replace('%.@.', '["garturlreq",'));

    // Build payload: all elements except the last 6, then append the last 2
    const slicedObj = [...obj.slice(0, -6), ...obj.slice(-2)];

    const payload = {
      'f.req': JSON.stringify([[
        ['Fbv4je', JSON.stringify(slicedObj), null, 'generic']
      ]])
    };

    // Step 3: POST to batchexecute
    const batchRes = await axios.post(
      'https://news.google.com/_/DotsSplashUi/data/batchexecute',
      new URLSearchParams(payload).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': BROWSER_UA,
        },
        timeout: 10000,
      }
    );

    // Step 4: Parse the garturlres response
    const cleanedText = batchRes.data.replace(")]}'", "");
    const jsonData = JSON.parse(cleanedText);

    if (jsonData[0]?.[2]) {
      const articleData = JSON.parse(jsonData[0][2]);
      // articleData[1] is the resolved publisher URL
      return articleData[1] || null;
    }

    return null;
  } catch (err: any) {
    // Fail silently — image will use fallback
    return null;
  }
}

/**
 * Fetches the Open Graph image from the actual publisher article page.
 * Tries og:image, twitter:image, and LD+JSON structured data.
 */
async function fetchArticleImage(articleUrl: string): Promise<string> {
  if (!articleUrl) return '';
  try {
    const res = await axios.get(articleUrl, {
      headers: { 'User-Agent': BROWSER_UA },
      timeout: 8000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(res.data);

    const candidates: (string | undefined)[] = [
      $('meta[property="og:image"]').attr('content'),
      $('meta[name="twitter:image"]').attr('content'),
      $('meta[name="twitter:image:src"]').attr('content'),
    ];

    // Try LD+JSON structured data for image
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        if (json.image) {
          if (typeof json.image === 'string') candidates.push(json.image);
          else if (json.image.url) candidates.push(json.image.url);
          else if (Array.isArray(json.image) && json.image.length > 0) {
            const first = json.image[0];
            candidates.push(typeof first === 'string' ? first : first?.url);
          }
        }
        if (json.thumbnailUrl) candidates.push(json.thumbnailUrl);
      } catch (e) {
        // Ignore malformed LD+JSON
      }
    });

    for (const img of candidates) {
      if (img && (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('//'))) {
        return img.startsWith('//') ? 'https:' + img : img;
      }
    }
    return '';
  } catch (err: any) {
    // Fail silently and let fallback handle it
    return '';
  }
}

/**
 * Full pipeline: resolves Google News link → actual article URL → og:image
 */
async function resolveArticleImage(googleNewsLink: string): Promise<string> {
  // Step 1: Resolve the real article URL via batchexecute
  const realUrl = await resolveGoogleNewsUrl(googleNewsLink);
  if (!realUrl) {
    return '';
  }

  // Step 2: Fetch the og:image from the real article page
  return await fetchArticleImage(realUrl);
}

/**
 * Fetches RSS feeds for all categories, parses, removes duplicates, and saves to MongoDB.
 * Ignores articles older than 48 hours.
 */
export async function fetchAndSyncNews(): Promise<void> {
  console.log('[NewsService] Starting news sync from Google News RSS feeds...');
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const limit = pLimit(3); // Throttle concurrent requests to avoid Google rate-limiting

  for (const [category, url] of Object.entries(CATEGORIES)) {
    try {
      console.log(`[NewsService] Fetching feed for category "${category}" from: ${url}`);
      const feed = await parser.parseURL(url);
      
      let upsertCount = 0;
      let skipCount = 0;

      // Filter for valid items first
      const validItems = feed.items.filter((item: any) => {
        const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
        if (publishedAt < fortyEightHoursAgo) {
          skipCount++;
          return false;
        }
        return true;
      });

      console.log(`[NewsService] Category "${category}" has ${validItems.length} recent articles. Resolving real article URLs and images...`);

      // Resolve real article URLs and images concurrently (throttled by p-limit)
      const resolvedArticles = await Promise.all(
        validItems.map((item: any) =>
          limit(async () => {
            const imageUrl = await resolveArticleImage(item.link || '');
            return { item, imageUrl };
          })
        )
      );

      for (const { item, imageUrl } of resolvedArticles) {
        const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
        const sourceName = item.source || 'Google News';
        const cleanTitle = cleanArticleTitle(item.title || '', sourceName);
        const description = item.contentSnippet || item.description || '';

        // Upsert to DB, matching unique 'link' field
        await News.findOneAndUpdate(
          { link: item.link },
          {
            title: cleanTitle,
            description: description,
            source: sourceName,
            link: item.link,
            image: imageUrl, // Real publisher og:image
            category: category,
            publishedAt: publishedAt,
            createdAt: new Date()
          },
          { upsert: true, returnDocument: 'after' }
        );
        upsertCount++;
      }

      console.log(`[NewsService] Category "${category}" synced successfully: ${upsertCount} upserted, ${skipCount} skipped (older than 48h).`);
    } catch (err: any) {
      console.error(`[NewsService] Failed to sync category "${category}":`, err.message);
    }
  }
  console.log('[NewsService] Finished news sync.');
}

/**
 * Retrieves latest 20 news articles for a category from MongoDB, sorted newest first
 */
export async function getNewsFromDb(category: string): Promise<any[]> {
  return await News.find({ category })
    .sort({ publishedAt: -1 })
    .limit(20)
    .lean();
}

/**
 * Daily cleanup at midnight: Delete news older than 48 hours
 */
export async function cleanupStaleNews(): Promise<void> {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  console.log(`[NewsService] Cleaning up stale news older than ${fortyEightHoursAgo.toISOString()}...`);
  
  try {
    const result = await News.deleteMany({ publishedAt: { $lt: fortyEightHoursAgo } });
    console.log(`[NewsService] Stale news cleanup complete. Deleted ${result.deletedCount} articles.`);
  } catch (err: any) {
    console.error('[NewsService] Failed to clean up stale news:', err.message);
  }
}
