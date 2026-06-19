'use client';

import React from 'react';
import type { PatternMatch } from '@/types/patternSearch';
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';

interface Props {
  match: PatternMatch;
  onClick: () => void;
}

function ReturnChip({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null;
  const isPos = value >= 0;
  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`text-xs font-bold font-mono tabular-nums mt-0.5 ${
          isPos ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
        }`}
      >
        {isPos ? '+' : ''}
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function SimilarityBadge({ score }: { score: number }) {
  const color =
    score >= 85
      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
      : score >= 70
      ? 'bg-primary/15 border-primary/30 text-primary'
      : 'bg-muted border-border text-muted-foreground';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold font-mono ${color}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          score >= 85
            ? 'bg-emerald-500'
            : score >= 70
            ? 'bg-primary'
            : 'bg-muted-foreground'
        }`}
      />
      {score.toFixed(1)}%
    </span>
  );
}

export default function PatternMatchCard({ match, onClick }: Props) {
  const patternStart = new Date(match.startDate).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
  const patternEnd = new Date(match.endDate).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });

  const maxGainPos = match.maxGain !== null && match.maxGain >= 0;
  const maxDrawdownNeg = match.maxDrawdown !== null && match.maxDrawdown < 0;

  return (
    <button
      id={`pattern-match-${match.symbol}-${match.startDate}`}
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 group active:scale-[0.99] cursor-pointer"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Symbol icon */}
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <BarChart3 size={14} className="text-primary" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground font-mono">
              {match.symbol}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar size={10} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {patternStart} → {patternEnd}
              </span>
            </div>
          </div>
        </div>
        <SimilarityBadge score={match.similarity} />
      </div>

      {/* Similarity bar */}
      <div className="w-full h-1 bg-muted rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 group-hover:brightness-110"
          style={{ width: `${Math.min(100, match.similarity)}%` }}
        />
      </div>

      {/* Returns grid or Active Scan label */}
      {match.future5dReturn !== null ||
      match.future10dReturn !== null ||
      match.future20dReturn !== null ||
      match.future50dReturn !== null ? (
        <div className="grid grid-cols-4 gap-1 mb-3 py-2.5 bg-muted/40 rounded-lg px-2">
          <ReturnChip value={match.future5dReturn} label="5D" />
          <ReturnChip value={match.future10dReturn} label="10D" />
          <ReturnChip value={match.future20dReturn} label="20D" />
          <ReturnChip value={match.future50dReturn} label="50D" />
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1.5 mb-3 py-2 bg-primary/5 border border-primary/10 rounded-lg px-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
            Pattern forming now (Active)
          </span>
        </div>
      )}

      {/* Max gain / drawdown */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <TrendingUp size={11} className="text-emerald-500" />
          <span className="text-muted-foreground">Max Gain:</span>
          <span
            className={`font-bold font-mono ${
              maxGainPos ? 'text-emerald-500 dark:text-emerald-400' : 'text-foreground'
            }`}
          >
            {match.maxGain !== null ? `+${match.maxGain.toFixed(1)}%` : '—'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown size={11} className="text-rose-500" />
          <span className="text-muted-foreground">Max DD:</span>
          <span
            className={`font-bold font-mono ${
              maxDrawdownNeg ? 'text-rose-500 dark:text-rose-400' : 'text-foreground'
            }`}
          >
            {match.maxDrawdown !== null ? `${match.maxDrawdown.toFixed(1)}%` : '—'}
          </span>
        </div>
      </div>
    </button>
  );
}
