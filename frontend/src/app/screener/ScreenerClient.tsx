'use client';

import { useEffect, useRef, useState } from 'react';
import { ScanSearch } from 'lucide-react';
import { ScreenerSearchBar } from '@/components/screener/ScreenerSearchBar';
import { SuggestedQueries } from '@/components/screener/SuggestedQueries';
import { AIExplanationPanel } from '@/components/screener/AIExplanationPanel';
import { ScreenerStats } from '@/components/screener/ScreenerStats';
import { ScreenerResultsTable } from '@/components/screener/ScreenerResultsTable';
import { useScreener } from '@/services/screenerService';
import { SortConfig } from '@/types/screener';

// ── Readiness check ──────────────────────────────────────────────────────────

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

async function checkAndSeedIfNeeded(): Promise<{ isReady: boolean; count: number }> {
  try {
    const statusRes = await fetch(`${BACKEND_URL}/api/screener/status`);
    if (!statusRes.ok) return { isReady: false, count: 0 };
    const status = await statusRes.json();

    if (!status.isReady) {
      // Trigger background seed — fire and forget
      fetch(`${BACKEND_URL}/api/screener/admin/refresh`, { method: 'POST' }).catch(() => {});
    }

    return { isReady: status.isReady, count: status.stockMetricsCount ?? 0 };
  } catch {
    return { isReady: false, count: 0 };
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ScreenerClient() {
  const { data, isLoading, error, search, setPage, setSortConfig, currentQuery, sortConfig } = useScreener();
  const [seedingStatus, setSeedingStatus] = useState<'checking' | 'seeding' | 'ready' | 'unknown'>('checking');
  const seedChecked = useRef(false);

  // On mount: check if stock_metrics is populated
  useEffect(() => {
    if (seedChecked.current) return;
    seedChecked.current = true;

    checkAndSeedIfNeeded().then(({ isReady, count }) => {
      if (isReady) {
        setSeedingStatus('ready');
      } else {
        setSeedingStatus('seeding');
        // Poll every 10 seconds until ready
        const poll = setInterval(async () => {
          const res = await checkAndSeedIfNeeded();
          if (res.isReady) {
            setSeedingStatus('ready');
            clearInterval(poll);
          }
        }, 10000);
      }
    });
  }, []);

  const handleSearch = (query: string) => {
    search(query);
  };

  return (
    <div className="fg-shell min-h-screen">
      {/* ── Search Header ─────────────────────────────────────────────────── */}
      <section className="relative px-4 pt-14 pb-8 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ScanSearch size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Stock Screener</h1>
              <p className="text-xs text-muted-foreground">Screen NIFTY 50 stocks with natural language</p>
            </div>
          </div>

          {/* Seeding notice */}
          {seedingStatus === 'seeding' && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-500">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              Computing stock metrics for the first time — this takes 1–2 minutes. Results will appear automatically.
            </div>
          )}

          {/* Search bar */}
          <div className="mb-5">
            <ScreenerSearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </div>

          {/* Suggestion chips */}
          <SuggestedQueries onSelect={handleSearch} isLoading={isLoading} />
        </div>
      </section>

      {/* ── Results ───────────────────────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-8">
        <div className="mx-auto max-w-7xl space-y-4">

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Loading — AI explanation skeleton */}
          {isLoading && (
            <AIExplanationPanel explanation="" isLoading />
          )}

          {/* Results */}
          {!isLoading && data && (
            <>
              {data.explanation && (
                <AIExplanationPanel explanation={data.explanation} />
              )}

              <ScreenerStats data={data} durationMs={data.durationMs} />

              <ScreenerResultsTable
                results={data.results}
                total={data.total}
                page={data.page}
                totalPages={data.totalPages}
                sortConfig={sortConfig}
                onSort={setSortConfig}
                onPageChange={setPage}
                isLoading={false}
              />
            </>
          )}

          {/* Initial empty state */}
          {!isLoading && !data && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-accent/10">
                  <ScanSearch size={28} className="text-primary" />
                </div>
              </div>
              <h2 className="text-base font-semibold text-foreground">Search to see results</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Try one of the suggestions above or type your own query
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
