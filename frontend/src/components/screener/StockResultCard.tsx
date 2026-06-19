'use client';

import { memo } from 'react';
import { ArrowUp, ArrowDown, Minus, ExternalLink, Activity } from 'lucide-react';
import { StockMetricResult } from '@/types/screener';
import Link from 'next/link';

// ─── Badge helpers ────────────────────────────────────────────────────────────

const TAG_STYLES: Record<string, string> = {
  '52W High': 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  '52W Low': 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  'Volume Spike': 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  'MACD Bullish': 'bg-success/15 text-success border-success/30',
  'MACD Bearish': 'bg-destructive/15 text-destructive border-destructive/30',
  '20/50 Cross': 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  '50/100 Cross': 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  'Golden Cross': 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  'RSI Oversold': 'bg-success/15 text-success border-success/30',
  'RSI Overbought': 'bg-warning/15 text-warning border-warning/30',
  'Big Gainer': 'bg-success/15 text-success border-success/30',
  'Big Loser': 'bg-destructive/15 text-destructive border-destructive/30',
};

function Tag({ label }: { label: string }) {
  const style = TAG_STYLES[label] ?? 'bg-muted/60 text-muted-foreground border-border/40';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style}`}>
      {label}
    </span>
  );
}

function RSIBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground/50">—</span>;
  const color =
    value < 30 ? 'text-success' :
    value > 70 ? 'text-warning' :
    value > 60 ? 'text-amber-400' :
    value < 40 ? 'text-sky-400' :
    'text-muted-foreground';
  return <span className={`text-sm font-bold tabular-nums ${color}`}>{value.toFixed(1)}</span>;
}

function MAStatus({ above }: { above: boolean }) {
  return above
    ? <span className="text-[10px] font-semibold text-success">↑ Above</span>
    : <span className="text-[10px] font-semibold text-destructive">↓ Below</span>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface StockResultCardProps {
  stock: StockMetricResult;
  rank: number;
  animationDelay?: number;
}

export const StockResultCard = memo(function StockResultCard({
  stock,
  rank,
  animationDelay = 0,
}: StockResultCardProps) {
  const isPositive = stock.changePct >= 0;
  const changeColor = isPositive ? 'text-success' : 'text-destructive';
  const changeBg = isPositive ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20';

  const trendBorder =
    stock.trendLabel === 'bullish' ? 'border-l-success/60' :
    stock.trendLabel === 'bearish' ? 'border-l-destructive/60' :
    'border-l-border/40';

  const trendIcon =
    stock.trendLabel === 'bullish' ? <ArrowUp size={11} className="text-success" /> :
    stock.trendLabel === 'bearish' ? <ArrowDown size={11} className="text-destructive" /> :
    <Minus size={11} className="text-muted-foreground" />;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-border/40 border-l-2 ${trendBorder} bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30`}
      style={{ animationDelay: `${animationDelay}ms` }}
      aria-label={`${stock.symbol} — ${stock.companyName}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Rank */}
          <span className="shrink-0 tabular-nums text-xs text-muted-foreground/50 w-5">
            {rank}
          </span>

          {/* Symbol + company */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/stock/${stock.symbol.replace('.NS', '')}`}
                className="font-bold text-foreground hover:text-primary transition-colors text-base leading-none"
              >
                {stock.symbol.replace('.NS', '')}
              </Link>
              <Link href={`/stock/${stock.symbol.replace('.NS', '')}`} aria-label="Open stock detail">
                <ExternalLink size={11} className="text-muted-foreground/40 hover:text-primary transition-colors" />
              </Link>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">{stock.companyName}</p>
          </div>
        </div>

        {/* Price + change */}
        <div className="flex flex-col items-end shrink-0">
          <span className="font-bold text-foreground text-base tabular-nums">
            ₹{stock.closePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums mt-1 ${changeBg} ${changeColor}`}>
            {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(stock.changePct).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Middle row — indicators */}
      <div className="mt-3.5 grid grid-cols-4 gap-2">
        {/* RSI */}
        <div className="rounded-xl bg-muted/30 px-3 py-2 text-center">
          <div className="text-[10px] text-muted-foreground mb-1">RSI</div>
          <RSIBadge value={stock.rsi14} />
        </div>

        {/* Volume ratio */}
        <div className="rounded-xl bg-muted/30 px-3 py-2 text-center">
          <div className="text-[10px] text-muted-foreground mb-1">Vol ×</div>
          <span className={`text-sm font-bold tabular-nums ${stock.volumeRatio >= 2 ? 'text-purple-400' : 'text-foreground'}`}>
            {stock.volumeRatio.toFixed(1)}x
          </span>
        </div>

        {/* SMA 50 */}
        <div className="rounded-xl bg-muted/30 px-3 py-2 text-center">
          <div className="text-[10px] text-muted-foreground mb-1">SMA50</div>
          <MAStatus above={stock.aboveSma50} />
        </div>

        {/* SMA 200 */}
        <div className="rounded-xl bg-muted/30 px-3 py-2 text-center">
          <div className="text-[10px] text-muted-foreground mb-1">SMA200</div>
          <MAStatus above={stock.aboveSma200} />
        </div>
      </div>

      {/* Tags row */}
      {stock.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {stock.tags.slice(0, 4).map(tag => (
            <Tag key={tag} label={tag} />
          ))}
        </div>
      )}

      {/* Bottom row */}
      <div className="mt-3 flex items-center justify-between">
        {/* Sector + cap */}
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {stock.sector}
          </span>
          <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[10px] capitalize text-muted-foreground/70">
            {stock.marketCapCategory}
          </span>
        </div>

        {/* Trend + score */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-full border border-border/40 px-2 py-0.5">
            {trendIcon}
            <span className="text-[10px] font-semibold capitalize">
              {stock.trendLabel}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <Activity size={9} />
            {stock.relevanceScore}
          </div>
        </div>
      </div>

      {/* Hover shimmer */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/3 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </article>
  );
});
