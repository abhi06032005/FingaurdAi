import { Request, Response } from 'express';
import { getNewsFromDb } from '../services/newsService';

/**
 * Controller to fetch news by category from MongoDB
 */
export async function getNewsByCategory(req: Request, res: Response, category: string): Promise<any> {
  try {
    const data = await getNewsFromDb(category);
    return res.status(200).json({
      success: true,
      category: category,
      count: data.length,
      data: data
    });
  } catch (err: any) {
    console.error(`[NewsController] Error fetching news for category "${category}":`, err.message);
    return res.status(500).json({
      success: false,
      error: `Failed to retrieve news articles for category "${category}"`
    });
  }
}
