'use client';

import React, { useMemo, useState } from 'react';
import type { PatternMatch, SortOption, WindowSize } from '@/types/patternSearch';
import PatternMatchCard from './PatternMatchCard';
import { ArrowDownUp } from 'lucide-react';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'similarity', label: 'Similarity' },
  { value: 'highestGain', label: 'Highest Gain' },
  { value: 'lowestDrawdown', label: 'Lowest DD' },
  { value: 'mostRecent', label: 'Most Recent' },
];

interface Props {
  matches: PatternMatch[];
  windowSize: WindowSize;
  isLoading?: boolean;
  onSelectMatch: (match: PatternMatch) => void;
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-muted" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-muted rounded w-20" />
          <div className="h-2.5 bg-muted rounded w-28" />
        </div>
        <div className="h-6 w-16 bg-muted rounded-full" />
      </div>
      <div className="h-1 bg-muted rounded mb-3" />
      <div className="h-10 bg-muted rounded-lg mb-3" />
      <div className="h-3 bg-muted rounded w-40" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
        <ArrowDownUp size={24} className="text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">No matches found</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Try drawing a different pattern or selecting a different candle window size.
        Make sure the pattern vectors have been precomputed.
      </p>
    </div>
  );
}

export default function PatternMatchList({
  matches,
  windowSize,
  isLoading,
  onSelectMatch,
}: Props) {
  const [sortBy, setSortBy] = useState<SortOption>('similarity');

  const sorted = useMemo(() => {
    const arr = [...matches];
    switch (sortBy) {
      case 'similarity':
        return arr.sort((a, b) => b.similarity - a.similarity);
      case 'highestGain':
        return arr.sort(
          (a, b) => (b.future50dReturn ?? -Infinity) - (a.future50dReturn ?? -Infinity),
        );
      case 'lowestDrawdown':
        return arr.sort(
          (a, b) => (b.maxDrawdown ?? -Infinity) - (a.maxDrawdown ?? -Infinity),
        );
      case 'mostRecent':
        return arr.sort(
          (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
        );
    }
  }, [matches, sortBy]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (matches.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {/* Header + sort */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-foreground">
            {matches.length} Matches Found
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            {windowSize}-candle window
          </span>
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              id={`sort-${opt.value}`}
              onClick={() => setSortBy(opt.value)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 border ${
                sortBy === opt.value
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-transparent border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {sorted.map(match => (
          <PatternMatchCard
            key={`${match.symbol}-${match.startDate}`}
            match={match}
            onClick={() => onSelectMatch(match)}
          />
        ))}
      </div>
    </div>
  );
}
