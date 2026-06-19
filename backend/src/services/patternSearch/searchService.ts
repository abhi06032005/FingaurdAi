/**
 * searchService.ts
 * Core pattern search engine.
 * Compares user's drawn pattern against pre-cached pattern vectors using DTW.
 * Returns top 20 matches ranked by similarity score.
 */

import { getVectors, CachedVector } from './patternCacheService';
import { dtwSimilarity } from '../../lib/patternSearch/dtw';
import { euclideanSimilarity } from '../../lib/patternSearch/euclidean';

export interface PatternMatch {
  symbol: string;
  similarity: number;         // 0–100, primary DTW score
  euclideanSimilarity: number; // secondary metric
  startDate: string;
  endDate: string;
  future5dReturn: number | null;
  future10dReturn: number | null;
  future20dReturn: number | null;
  future50dReturn: number | null;
  maxGain: number | null;
  maxDrawdown: number | null;
}

const TOP_N = 20;

/**
 * Search for the top N pattern matches for a given query pattern and window size.
 * The query pattern must already be normalized to 100 points in [0, 1].
 */
export function searchPatterns(
  queryPattern: number[],
  windowSize: number,
  mode: 'current' | 'historical' = 'current',
): PatternMatch[] {
  const allVectors = getVectors(windowSize);

  if (allVectors.length === 0) {
    return [];
  }

  let vectors = allVectors;
  if (mode === 'current') {
    // Filter to keep only the latest vector (ending on the most recent date) for each symbol
    const symbolLatestVector = new Map<string, CachedVector>();
    for (const vec of allVectors) {
      const existing = symbolLatestVector.get(vec.symbol);
      if (!existing || vec.endDate > existing.endDate) {
        symbolLatestVector.set(vec.symbol, vec);
      }
    }
    vectors = Array.from(symbolLatestVector.values());
  }

  // Score all vectors
  const scored: Array<{ vec: CachedVector; sim: number; dtw: number; euc: number }> = [];

  for (const vec of vectors) {
    const dtwVal = dtwSimilarity(queryPattern, vec.normalizedSeries);
    const eucVal = euclideanSimilarity(queryPattern, vec.normalizedSeries);
    // Hybrid score: 50% DTW (narrow-band) + 50% Euclidean distance
    const sim = 0.5 * dtwVal + 0.5 * eucVal;

    // Filter to return only patterns whose match score is above 50%
    if (sim >= 50) {
      scored.push({ vec, sim, dtw: dtwVal, euc: eucVal });
    }
  }

  // Sort by hybrid similarity descending
  scored.sort((a, b) => b.sim - a.sim);

  // Return top N
  return scored.slice(0, TOP_N).map(({ vec, sim, dtw, euc }) => ({
    symbol: vec.symbol.replace('.NS', ''), // Strip suffix for display
    similarity: Math.round(sim * 10) / 10,
    euclideanSimilarity: Math.round(euc * 10) / 10,
    startDate: vec.startDate,
    endDate: vec.endDate,
    future5dReturn: vec.future5dReturn,
    future10dReturn: vec.future10dReturn,
    future20dReturn: vec.future20dReturn,
    future50dReturn: vec.future50dReturn,
    maxGain: vec.maxGain,
    maxDrawdown: vec.maxDrawdown,
  }));
}
