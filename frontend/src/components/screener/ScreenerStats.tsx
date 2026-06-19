'use client';

import { BarChart2, TrendingUp, ArrowDown, ArrowUp, ChevronRight } from 'lucide-react';
import { ScreenerResponse } from '@/types/screener';

interface ScreenerStatsProps {
  data: ScreenerResponse;
  durationMs?: number;
}

export function ScreenerStats({ data, durationMs }: ScreenerStatsProps) {
  const topSectors = Object.entries(data.sectorBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/50 bg-card/60 px-5 py-3.5 backdrop-blur-sm">
      {/* Matches */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <BarChart2 size={15} />
        </div>
        <div>
          <div className="text-lg font-bold leading-none">{data.total.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">stocks matched</div>
        </div>
      </div>

      {/* Separator */}
      <div className="hidden sm:block h-8 w-px bg-border/60" />

      {/* Bullish */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success">
          <ArrowUp size={13} />
        </div>
        <div>
          <span className="text-base font-semibold text-success">{data.bullishCount}</span>
          <span className="ml-1 text-[11px] text-muted-foreground">bullish</span>
        </div>
      </div>

      {/* Bearish */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
          <ArrowDown size={13} />
        </div>
        <div>
          <span className="text-base font-semibold text-destructive">{data.bearishCount}</span>
          <span className="ml-1 text-[11px] text-muted-foreground">bearish</span>
        </div>
      </div>

      {/* Separator */}
      <div className="hidden sm:block h-8 w-px bg-border/60" />

      {/* Top Sectors */}
      {topSectors.length > 0 && (
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-muted-foreground" />
          <div className="flex items-center gap-1.5">
            {topSectors.map(([sector, count], i) => (
              <div key={sector} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} className="text-border" />}
                <span className="rounded bg-muted/60 px-2 py-0.5 text-[11px] font-medium">
                  {sector}
                  <span className="ml-1 text-muted-foreground">({count})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query time */}
      {durationMs !== undefined && (
        <div className="ml-auto text-[11px] text-muted-foreground/60">
          {durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`}
        </div>
      )}
    </div>
  );
}
