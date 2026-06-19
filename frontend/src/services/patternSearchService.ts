'use client';

import { useMutation } from '@tanstack/react-query';
import type {
  PatternSearchRequest,
  PatternSearchResponse,
  WindowSize,
} from '@/types/patternSearch';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

export async function fetchPatternSearch(
  pattern: number[],
  windowSize: WindowSize,
  mode?: 'current' | 'historical',
): Promise<PatternSearchResponse> {
  const body: PatternSearchRequest = { pattern, windowSize, mode };

  const res = await fetch(`${BACKEND_URL}/api/pattern-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Search failed: ${res.status}`);
  }

  return res.json();
}

export function usePatternSearch() {
  return useMutation({
    mutationFn: ({
      pattern,
      windowSize,
      mode,
    }: {
      pattern: number[];
      windowSize: WindowSize;
      mode?: 'current' | 'historical';
    }) => fetchPatternSearch(pattern, windowSize, mode),
  });
}

/** Fetch OHLCV candles for a symbol from the analysis route */
export async function fetchCandlesForSymbol(symbol: string): Promise<any[]> {
  const sym = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
  const res = await fetch(`${BACKEND_URL}/api/analysis/${sym}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.candles ?? [];
}

/** Fetch candles around a specific date range for pattern chart display */
export async function fetchCandlesRange(
  symbol: string,
  startDate: string,
  endDate: string,
): Promise<{ time: string; open: number; high: number; low: number; close: number; volume: number }[]> {
  const sym = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/analysis/${sym}`,
    );
    if (!res.ok) return [];
    // The analysis route returns processed data; we need raw candles
    // Fall through to an alternative endpoint if available
    return [];
  } catch {
    return [];
  }
}
