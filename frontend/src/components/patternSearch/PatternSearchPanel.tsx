'use client';

import React, { useRef, useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import DrawingCanvas, { DrawingCanvasHandle } from './DrawingCanvas';
import type { WindowSize, PatternMatch, SortOption } from '@/types/patternSearch';
import { usePatternSearch } from '@/services/patternSearchService';

const WINDOW_SIZES: { value: WindowSize; label: string }[] = [
  { value: 20, label: '20D' },
  { value: 50, label: '50D' },
  { value: 100, label: '100D' },
  { value: 200, label: '200D' },
];

interface Props {
  onResults: (matches: PatternMatch[], windowSize: WindowSize, pattern: number[] | null) => void;
  disabled?: boolean;
}

export default function PatternSearchPanel({ onResults, disabled = false }: Props) {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [windowSize, setWindowSize] = useState<WindowSize>(50);
  const [mode, setMode] = useState<'current' | 'historical'>('current');
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = usePatternSearch();

  const handleSearch = () => {
    setError(null);
    const pattern = canvasRef.current?.extractPattern();

    if (!pattern) {
      setError('Please draw a pattern on the canvas first.');
      return;
    }

    mutate(
      { pattern, windowSize, mode },
      {
        onSuccess: data => {
          onResults(data.matches ?? [], windowSize, pattern);
        },
        onError: (err: any) => {
          setError(err?.message ?? 'Search failed. Please try again.');
        },
      },
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">Draw Pattern</h2>
          <p className="text-xs text-muted-foreground">
            {mode === 'current'
              ? 'Find stocks currently forming this pattern'
              : 'Sketch a price shape → find historical matches'}
          </p>
        </div>
        {/* Window size selector */}
        <div className="flex items-center gap-1">
          {WINDOW_SIZES.map(ws => (
            <button
              key={ws.value}
              id={`pattern-window-${ws.value}`}
              onClick={() => setWindowSize(ws.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 border ${
                windowSize === ws.value
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {ws.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Selector Toggle */}
      <div className="flex items-center justify-between py-1.5 border-t border-b border-border/40">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Search Target</span>
        <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border gap-0.5">
          <button
            type="button"
            onClick={() => setMode('current')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer ${
              mode === 'current'
                ? 'bg-card text-primary shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Live Formations
          </button>
          <button
            type="button"
            onClick={() => setMode('historical')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer ${
              mode === 'historical'
                ? 'bg-card text-primary shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Historical Setups
          </button>
        </div>
      </div>

      {/* Drawing Canvas */}
      <DrawingCanvas ref={canvasRef} />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* Search Button */}
      <button
        id="pattern-search-btn"
        onClick={handleSearch}
        disabled={isPending || disabled}
        title={disabled ? 'Pattern index is still loading — please wait' : undefined}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {isPending ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Searching patterns…
          </>
        ) : disabled ? (
          <>
            <Loader2 size={15} className="animate-pulse" />
            Index loading…
          </>
        ) : (
          <>
            <Search size={15} />
            Search Patterns
          </>
        )}
      </button>
    </div>
  );
}
