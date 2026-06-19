'use client';

import { useState } from 'react';
import { ScreenerFilter, ScreenerResponse, ScreenerSuggestion, SortConfig } from '@/types/screener';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

// ─── API calls ────────────────────────────────────────────────────────────────

export async function queryScreener(
  query: string,
  page = 1,
  limit = 20,
  sortConfig?: SortConfig,
): Promise<ScreenerResponse> {
  const res = await fetch(`${BACKEND_URL}/api/screener/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      page,
      limit,
      sortBy: sortConfig?.field,
      sortOrder: sortConfig?.order ?? 'desc',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Screener query failed');
  }

  return res.json();
}

export async function filterScreener(
  filter: ScreenerFilter,
  page = 1,
  limit = 20,
  sortConfig?: SortConfig,
): Promise<ScreenerResponse> {
  const res = await fetch(`${BACKEND_URL}/api/screener/filter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filter,
      page,
      limit,
      sortBy: sortConfig?.field,
      sortOrder: sortConfig?.order ?? 'desc',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Filter query failed');
  }

  return res.json();
}

export async function fetchSuggestions(): Promise<ScreenerSuggestion[]> {
  const res = await fetch(`${BACKEND_URL}/api/screener/suggestions`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions ?? [];
}

// ─── React hook ───────────────────────────────────────────────────────────────

export interface UseScreenerState {
  data: ScreenerResponse | null;
  isLoading: boolean;
  error: string | null;
  search: (query: string, page?: number) => Promise<void>;
  setPage: (page: number) => Promise<void>;
  setSortConfig: (config: SortConfig) => void;
  currentQuery: string;
  sortConfig: SortConfig;
}

export function useScreener(): UseScreenerState {
  const [data, setData] = useState<ScreenerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'relevanceScore', order: 'desc' });

  const search = async (query: string, page = 1) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setCurrentQuery(query);

    try {
      const result = await queryScreener(query, page, 20, sortConfig);
      setData(result);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const setPage = async (page: number) => {
    if (!currentQuery) return;
    await search(currentQuery, page);
  };

  const updateSort = (config: SortConfig) => {
    setSortConfig(config);
    if (currentQuery) {
      search(currentQuery, 1);
    }
  };

  return {
    data,
    isLoading,
    error,
    search,
    setPage,
    setSortConfig: updateSort,
    currentQuery,
    sortConfig,
  };
}
