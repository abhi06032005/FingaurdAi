'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { PatternMatch, WindowSize } from '@/types/patternSearch';
import PatternSearchPanel from '@/components/patternSearch/PatternSearchPanel';
import PatternMatchList from '@/components/patternSearch/PatternMatchList';
import PatternAnalysisDrawer from '@/components/patternSearch/PatternAnalysisDrawer';
import { Pencil, Zap, ShieldCheck, Loader2, DatabaseZap, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

type IndexStatus = 'checking' | 'building' | 'ready' | 'error';

interface StatusData {
  isReady: boolean;
  totalCached: number;
  dbStats: Record<string, number>;
  cacheStats: Record<string, number>;
}

async function checkStatus(): Promise<StatusData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/pattern-search/status`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function triggerCacheReload(): Promise<void> {
  await fetch(`${BACKEND_URL}/api/pattern-search/reload-cache`, { method: 'POST' });
}

export default function PatternSearchClient() {
  const [matches, setMatches] = useState<PatternMatch[]>([]);
  const [windowSize, setWindowSize] = useState<WindowSize>(50);
  const [selectedMatch, setSelectedMatch] = useState<PatternMatch | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [drawnPattern, setDrawnPattern] = useState<number[] | null>(null);
  const [indexStatus, setIndexStatus] = useState<IndexStatus>('checking');
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkedRef = useRef(false);

  // On mount: check index status and auto-reload cache if DB has data but cache is empty
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const doCheck = async () => {
      const data = await checkStatus();
      if (!data) {
        setIndexStatus('error');
        return;
      }
      setStatusData(data);

      const totalInDb = Object.values(data.dbStats).reduce((a, b) => a + b, 0);

      if (data.isReady && data.totalCached > 0) {
        // Cache is warm and has data — all good
        setIndexStatus('ready');
      } else if (totalInDb > 0 && data.totalCached === 0) {
        // DB has data but cache is empty — trigger reload
        setIndexStatus('building');
        try {
          await triggerCacheReload();
          const refreshed = await checkStatus();
          setStatusData(refreshed);
          setIndexStatus(refreshed && refreshed.totalCached > 0 ? 'ready' : 'building');
        } catch {
          setIndexStatus('error');
        }
      } else if (totalInDb === 0) {
        // Nothing in DB yet — seed is running, poll until ready
        setIndexStatus('building');
        pollRef.current = setInterval(async () => {
          const polled = await checkStatus();
          if (!polled) return;
          const dbTotal = Object.values(polled.dbStats).reduce((a, b) => a + b, 0);
          if (dbTotal > 0) {
            // DB now has data — trigger cache load
            await triggerCacheReload();
            const final = await checkStatus();
            setStatusData(final);
            if (final && final.totalCached > 0) {
              setIndexStatus('ready');
              if (pollRef.current) clearInterval(pollRef.current);
            }
          }
        }, 15000); // poll every 15s
      } else {
        setIndexStatus('ready');
      }
    };

    doCheck();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleResults = (
    results: PatternMatch[],
    ws: WindowSize,
    pattern: number[] | null,
  ) => {
    setMatches(results);
    setWindowSize(ws);
    setHasSearched(true);
    setIsSearching(false);
    setDrawnPattern(pattern);
  };

  const handleSelectMatch = (match: PatternMatch) => {
    setSelectedMatch(match);
  };

  const handleManualReload = async () => {
    setIndexStatus('checking');
    await triggerCacheReload();
    const data = await checkStatus();
    setStatusData(data);
    setIndexStatus(data && data.totalCached > 0 ? 'ready' : 'building');
  };

  return (
    <div className="fg-shell min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">

        {/* ── Page Header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="fg-eyebrow">
              <Pencil size={11} />
              Pattern Search
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold fg-title tracking-tight">
            Draw Pattern Search
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
            Sketch a price shape, choose a candle window, and discover historical
            NIFTY 50 setups that match your pattern.
          </p>

          {/* Quick feature pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {[
              { icon: <Zap size={10} />, label: 'Sub-second search' },
              { icon: <ShieldCheck size={10} />, label: 'No AI — pure math' },
              { icon: <Pencil size={10} />, label: 'Draw any shape' },
            ].map(pill => (
              <span
                key={pill.label}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-[10px] font-medium text-muted-foreground bg-muted/40"
              >
                <span className="text-primary">{pill.icon}</span>
                {pill.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Index Status Banner ── */}
        {indexStatus === 'checking' && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin" />
            Checking pattern index status…
          </div>
        )}

        {indexStatus === 'building' && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500 flex-shrink-0" />
            <span>
              <strong>Pattern index is being built</strong> — computing rolling windows for NIFTY 50 stocks.
              This runs once and typically takes 5–10 minutes. Search will be available when complete.
              The page polls automatically every 15 seconds.
            </span>
          </div>
        )}

        {indexStatus === 'error' && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
            <span>Could not connect to pattern search service. Make sure the backend is running.</span>
            <button
              onClick={handleManualReload}
              className="flex items-center gap-1.5 font-semibold hover:underline flex-shrink-0"
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        {indexStatus === 'ready' && statusData && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <DatabaseZap size={13} />
              <span>
                <strong>{statusData.totalCached.toLocaleString()}</strong> pattern vectors loaded —{' '}
                {Object.entries(statusData.cacheStats).map(([ws, count]) => `${ws}D: ${count}`).join(' · ')}
              </span>
            </div>
            <button
              onClick={handleManualReload}
              title="Reload cache from DB"
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        )}

        {/* ── Main Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

          {/* Left — Drawing panel (sticky on desktop) */}
          <div className="lg:sticky lg:top-20">
            <PatternSearchPanel
              onResults={handleResults}
              disabled={indexStatus !== 'ready'}
            />

            {/* How it works */}
            <div className="mt-4 bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">
                How it works
              </p>
              <ol className="space-y-2">
                {[
                  'Draw a price shape on the canvas',
                  'Select candle window (20–200 days)',
                  'Click Search — results appear instantly',
                  'Click any card to open detailed analysis',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="w-4 h-4 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* SEBI Disclaimer */}
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
              <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed">
                <strong>⚠ Educational use only.</strong> Historical pattern matches do not
                constitute investment advice. Past market behaviour does not predict future
                returns. SEBI regulations apply.
              </p>
            </div>
          </div>

          {/* Right — Results */}
          <div>
            {!hasSearched && !isSearching && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative mb-5">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150" />
                  <div className="relative w-16 h-16 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                    <Pencil size={28} className="text-primary" />
                  </div>
                </div>
                <h2 className="text-base font-semibold text-foreground">
                  {indexStatus === 'building' ? 'Index building…' : 'Draw to discover'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  {indexStatus === 'building'
                    ? 'Pattern index is being computed in the background. Drawing is disabled until it\'s ready.'
                    : 'Draw any price pattern on the canvas and hit Search to find historically similar setups across NIFTY 50.'}
                </p>
              </div>
            )}

            {(hasSearched || isSearching) && (
              <PatternMatchList
                matches={matches}
                windowSize={windowSize}
                isLoading={isSearching}
                onSelectMatch={handleSelectMatch}
              />
            )}
          </div>
        </div>
      </div>

      {/* Analysis Drawer */}
      <PatternAnalysisDrawer
        match={selectedMatch}
        drawnPattern={drawnPattern}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
}
