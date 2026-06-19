import { GoogleGenerativeAI } from '@google/generative-ai';

// Parse keys from env variables
const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
const keys = rawKeys
  .split(',')
  .map(k => k.trim())
  .filter(Boolean);

// Define minimum gap between calls on the SAME API key
const MIN_GAP_MS = 4500;

interface KeyTracker {
  apiKey: string;
  lastCallTime: number;
  isCooldownUntil: number;
}

// Fallback to a dummy key if none configured to prevent initialization errors
const apiKeys = keys.length > 0 ? keys : ['DUMMY_KEY'];

const trackers: KeyTracker[] = apiKeys.map(key => ({
  apiKey: key,
  lastCallTime: 0,
  isCooldownUntil: 0,
}));

// Sequence queue to guarantee selection and queueing are fully serialized process-wide
let queue: Promise<any> = Promise.resolve();

/**
 * Executes a Gemini API operation using key rotation.
 * Automatically picks the best key, enforces gaps, cools down keys on 429 errors,
 * and retries automatically up to trackers.length * 2 times.
 */
export async function geminiQueue<T>(
  fn: (client: GoogleGenerativeAI) => Promise<T>
): Promise<T> {
  if (keys.length === 0) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  return new Promise<T>((resolve, reject) => {
    queue = queue.then(async () => {
      let attempts = 0;
      const maxAttempts = Math.min(trackers.length * 2, 5);

      while (attempts < maxAttempts) {
        const now = Date.now();
        
        // Find keys that are not cooling down
        const availableTrackers = trackers.filter(t => t.isCooldownUntil < now);

        let selectedTracker: KeyTracker | undefined;
        if (availableTrackers.length > 0) {
          // Select the key that was called least recently
          selectedTracker = availableTrackers.reduce((prev, curr) => 
            prev.lastCallTime < curr.lastCallTime ? prev : curr
          );
        } else {
          // All keys are on cooldown. Pick the one that cools down first.
          selectedTracker = trackers.reduce((prev, curr) => 
            prev.isCooldownUntil < curr.isCooldownUntil ? prev : curr
          );
        }

        // Wait for cooldown if necessary
        const cooldownWait = selectedTracker.isCooldownUntil - Date.now();
        if (cooldownWait > 0) {
          await delay(cooldownWait);
        }

        // Enforce MIN_GAP_MS between calls on this specific key
        const elapsed = Date.now() - selectedTracker.lastCallTime;
        if (elapsed < MIN_GAP_MS) {
          await delay(MIN_GAP_MS - elapsed);
        }

        selectedTracker.lastCallTime = Date.now();
        const client = new GoogleGenerativeAI(selectedTracker.apiKey);

        try {
          const result = await fn(client);
          resolve(result);
          return;
        } catch (error: any) {
          const isRateLimit = error?.status === 429 || 
            (error?.message && error.message.toLowerCase().includes('quota')) ||
            (error?.message && error.message.toLowerCase().includes('rate limit')) ||
            (error?.message && error.message.toLowerCase().includes('resource_exhausted')) ||
            (error?.message && error.message.toLowerCase().includes('exhausted'));

          if (isRateLimit) {
            attempts++;
            // Cool down the selected key for 30 seconds
            selectedTracker.isCooldownUntil = Date.now() + 30000;
            console.warn(`[GeminiRateLimiter] API Key starting with ${selectedTracker.apiKey.slice(0, 8)}... hit rate limit. Cooling down for 30s. Attempt ${attempts}/${maxAttempts}`);
            continue;
          } else {
            reject(error);
            return;
          }
        }
      }
      reject(new Error(`All Gemini keys failed or were rate limited after ${attempts} attempts.`));
    }).catch((err) => {
      reject(err);
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
