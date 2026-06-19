/**
 * seed_pattern_vectors.ts
 * One-off script to seed the pattern_vectors table.
 * Run with: ts-node-dev --transpile-only src/seed_pattern_vectors.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { computeAllPatternVectors } from './services/patternSearch/vectorComputeService';
import { logger } from './utils/logger';

async function main() {
  logger.info('[Seed] Starting pattern vector precomputation...');
  try {
    const result = await computeAllPatternVectors();
    logger.info(
      `[Seed] Done! Inserted: ${result.totalInserted}, Skipped: ${result.totalSkipped}, Duration: ${result.durationMs}ms`,
    );
    process.exit(0);
  } catch (err) {
    logger.error('[Seed] Failed:', err);
    process.exit(1);
  }
}

main();
