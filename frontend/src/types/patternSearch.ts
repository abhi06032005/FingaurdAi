/**
 * patternSearch.ts
 * TypeScript types for the Draw Pattern Search feature.
 */

export type WindowSize = 20 | 50 | 100 | 200;

export type SortOption = 'similarity' | 'highestGain' | 'lowestDrawdown' | 'mostRecent';

export interface PatternMatch {
  symbol: string;
  similarity: number;
  euclideanSimilarity: number;
  startDate: string;
  endDate: string;
  future5dReturn: number | null;
  future10dReturn: number | null;
  future20dReturn: number | null;
  future50dReturn: number | null;
  maxGain: number | null;
  maxDrawdown: number | null;
}

export interface PatternSearchRequest {
  pattern: number[];
  windowSize: WindowSize;
  mode?: 'current' | 'historical';
}

export interface PatternSearchResponse {
  success: boolean;
  matches: PatternMatch[];
  meta: {
    windowSize: WindowSize;
    vectorsScanned: number;
    matchesReturned: number;
    durationMs: number;
  };
}

export interface CandleData {
  time: string; // 'YYYY-MM-DD'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
