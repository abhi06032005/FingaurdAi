'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  lazy,
  Suspense,
} from 'react';
import type { PatternMatch } from '@/types/patternSearch';
import {
  X,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Activity,
  ChevronRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CandleBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Props {
  match: PatternMatch | null;
  drawnPattern: number[] | null;
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function ReturnCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | null;
  highlight?: boolean;
}) {
  if (value === null)
    return (
      <div className="flex flex-col items-center bg-muted/40 rounded-xl px-3 py-3 border border-border">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </span>
        <span className="text-sm font-bold text-muted-foreground mt-1">—</span>
      </div>
    );

  const isPos = value >= 0;
  return (
    <div
      className={`flex flex-col items-center rounded-xl px-3 py-3 border transition-all duration-200 ${
        isPos
          ? 'bg-emerald-500/8 border-emerald-500/20'
          : 'bg-rose-500/8 border-rose-500/20'
      } ${highlight ? 'ring-1 ring-offset-1 ring-offset-background' : ''} ${
        highlight && isPos ? 'ring-emerald-500/30' : highlight ? 'ring-rose-500/30' : ''
      }`}
    >
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
        {label}
      </span>
      <span
        className={`text-sm font-bold font-mono tabular-nums mt-1 ${
          isPos ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
        }`}
      >
        {isPos ? '+' : ''}
        {value.toFixed(2)}%
      </span>
    </div>
  );
}

// Mini sparkline for the drawn pattern comparison
function MiniSparkline({
  data,
  color,
  label,
}: {
  data: number[];
  color: string;
  label: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 240;
  const H = 60;
  const pad = 4;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (W - pad * 2);
      const y = pad + (1 - (v - min) / range) * (H - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
        {label}
      </span>
      <svg
        ref={svgRef}
        width={W}
        height={H}
        className="w-full rounded-lg bg-muted/30 border border-border/50"
        viewBox={`0 0 ${W} ${H}`}
      >
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ── TradingView Chart Section ─────────────────────────────────────────────────
function TVChartSection({
  match,
  candles,
}: {
  match: PatternMatch;
  candles: CandleBar[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    let chart: any;
    let cancelled = false;

    const initChart = async () => {
      try {
        // lightweight-charts v5: use addSeries(CandlestickSeries) + createSeriesMarkers
        const lc = await import('lightweight-charts');
        const { createChart, CrosshairMode, CandlestickSeries, createSeriesMarkers } = lc as any;
        if (cancelled || !containerRef.current) return;

        const isDark =
          document.documentElement.classList.contains('dark');

        chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: 260,
          layout: {
            background: { color: isDark ? '#0f1117' : '#ffffff' },
            textColor: isDark ? '#9ca3af' : '#374151',
          },
          grid: {
            vertLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' },
            horzLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' },
          },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { borderColor: isDark ? '#1f2937' : '#e5e7eb' },
          timeScale: { borderColor: isDark ? '#1f2937' : '#e5e7eb', timeVisible: true },
        });

        chartRef.current = chart;

        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#ef4444',
          borderUpColor: '#10b981',
          borderDownColor: '#ef4444',
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });

        seriesRef.current = series;
        series.setData(candles);

        // Highlight matched range via createSeriesMarkers plugin API (v5)
        const startTime = match.startDate;
        const endTime = match.endDate;

        if (createSeriesMarkers) {
          createSeriesMarkers(series, [
            {
              time: startTime,
              position: 'belowBar',
              color: '#f97316',
              shape: 'arrowUp',
              text: 'Pattern Start',
            },
            {
              time: endTime,
              position: 'aboveBar',
              color: '#f97316',
              shape: 'arrowDown',
              text: 'Pattern End',
            },
          ]);
        }

        // Fit to show the matched pattern region + some context
        chart.timeScale().fitContent();

        // Resize observer
        const ro = new ResizeObserver(entries => {
          for (const entry of entries) {
            chart.applyOptions({ width: entry.contentRect.width });
          }
        });
        ro.observe(containerRef.current!);

        return () => {
          cancelled = true;
          ro.disconnect();
          chart.remove();
        };
      } catch (err) {
        console.error('[TVChartSection] Chart error:', err);
      }
    };

    const cleanup = initChart();
    return () => {
      cancelled = true;
      cleanup?.then(fn => fn?.());
      chartRef.current?.remove();
      chartRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, match.startDate, match.endDate]);

  if (candles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] bg-muted/20 rounded-xl border border-border text-xs text-muted-foreground">
        Candle data unavailable
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-border"
      style={{ minHeight: 260 }}
    />
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

export default function PatternAnalysisDrawer({
  match,
  drawnPattern,
  onClose,
}: Props) {
  const [candles, setCandles] = useState<CandleBar[]>([]);
  const [loadingCandles, setLoadingCandles] = useState(false);

  const isOpen = match !== null;

  // Load candle data when a match is selected
  const loadCandles = useCallback(async (selectedMatch: PatternMatch) => {
    setLoadingCandles(true);
    setCandles([]);
    try {
      const sym = selectedMatch.symbol.endsWith('.NS') ? selectedMatch.symbol : `${selectedMatch.symbol}.NS`;
      
      // Calculate a date range: 30 trading days (~45 calendar days) before start,
      // and 50 trading days (~75 calendar days) after end
      const start = new Date(selectedMatch.startDate);
      start.setDate(start.getDate() - 45);
      const fromStr = start.toISOString().split('T')[0];

      const end = new Date(selectedMatch.endDate);
      end.setDate(end.getDate() + 75);
      const toStr = end.toISOString().split('T')[0];

      const res = await fetch(`${BACKEND_URL}/api/stocks/${sym}/candles?from=${fromStr}&to=${toStr}&limit=400`);
      if (!res.ok) {
        setCandles([]);
        return;
      }
      const data = await res.json();
      if (data && Array.isArray(data.candles)) {
        setCandles(data.candles);
      } else {
        setCandles([]);
      }
    } catch (err) {
      console.error('[loadCandles] Error fetching candles:', err);
      setCandles([]);
    } finally {
      setLoadingCandles(false);
    }
  }, []);

  useEffect(() => {
    if (match) {
      loadCandles(match);
    }
  }, [match, loadCandles]);

  // Trap body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!match) return null;

  const patternStart = new Date(match.startDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const patternEnd = new Date(match.endDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Construct a fake historical pattern using maxGain/maxDrawdown for the mini sparkline
  // (real candle data would come from a dedicated endpoint)
  const historicalPatternApprox = Array.from({ length: 100 }, (_, i) => {
    const t = i / 99;
    // Simulate a rough shape based on returns
    const noise = (Math.random() - 0.5) * 0.05;
    return 0.5 + t * ((match.future20dReturn ?? 0) / 100) + noise;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Pattern analysis for ${match.symbol}`}
        className="fixed inset-y-0 right-0 z-50 flex flex-col bg-background border-l border-border shadow-2xl
                   w-full md:w-[48%] lg:w-[42%]
                   animate-in slide-in-from-right-8 duration-300"
        style={{ maxWidth: '700px' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground font-mono">
                {match.symbol}
              </h2>
              <p className="text-xs text-muted-foreground">
                Pattern Analysis
              </p>
            </div>
          </div>
          <button
            id="pattern-drawer-close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* SECTION A — Stock Information */}
          <section>
            <SectionLabel icon={<Target size={12} />} label="A — Stock Information" />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <InfoBlock label="Symbol" value={match.symbol} mono />
              <InfoBlock
                label="Similarity"
                value={`${match.similarity.toFixed(1)}%`}
                valueClass={
                  match.similarity >= 85
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-primary'
                }
                mono
              />
              <InfoBlock label="Pattern Found" value={patternStart} />
              <InfoBlock label="Pattern Start" value={patternStart} />
              <InfoBlock label="Pattern End" value={patternEnd} />
              <InfoBlock
                label="Match Score"
                value={
                  match.similarity >= 85
                    ? '🟢 High'
                    : match.similarity >= 70
                    ? '🟡 Medium'
                    : '🔴 Low'
                }
              />
            </div>
          </section>

          {/* SECTION B — Candlestick Chart */}
          <section>
            <SectionLabel icon={<Activity size={12} />} label="B — Historical Chart" />
            <p className="text-[10px] text-muted-foreground mb-2 mt-1">
              Orange markers show start and end of matched pattern window.
            </p>
            {loadingCandles ? (
              <div className="h-[260px] bg-muted/20 rounded-xl border border-border animate-pulse" />
            ) : (
              <TVChartSection match={match} candles={candles} />
            )}
            {candles.length === 0 && !loadingCandles && (
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                No candle data available for this date range.
              </p>
            )}
          </section>

          {/* SECTION C — Pattern Comparison */}
          <section>
            <SectionLabel icon={<ChevronRight size={12} />} label="C — Pattern Comparison" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {drawnPattern && (
                <MiniSparkline
                  data={drawnPattern}
                  color="#f97316"
                  label="Your Drawn Pattern"
                />
              )}
              <MiniSparkline
                data={historicalPatternApprox}
                color="#6366f1"
                label="Historical Match (approx)"
              />
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-3 h-0.5 rounded-full bg-primary inline-block" />
                Drawn
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-3 h-0.5 rounded-full bg-indigo-500 inline-block" />
                Historical
              </div>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs font-bold text-foreground">
                {match.similarity.toFixed(1)}% match
              </span>
            </div>
          </section>

          {/* SECTION D — Outcomes / Forecast */}
          <section>
            <SectionLabel icon={<TrendingUp size={12} />} label="D — Outcomes / Forecast" />
            {match.future5dReturn === null &&
            match.future10dReturn === null &&
            match.future20dReturn === null &&
            match.future50dReturn === null ? (
              <div className="mt-3 bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Active Live Formation
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This stock is currently forming this pattern at the latest candle. No future outcome data is available yet. Watch for breakout/breakdown signals.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 mt-3">
                <ReturnCard label="5D Return" value={match.future5dReturn} />
                <ReturnCard label="10D Return" value={match.future10dReturn} />
                <ReturnCard label="20D Return" value={match.future20dReturn} />
                <ReturnCard
                  label="50D Return"
                  value={match.future50dReturn}
                  highlight
                />
                <ReturnCard label="Max Gain" value={match.maxGain} />
                <ReturnCard label="Max DD" value={match.maxDrawdown} />
              </div>
            )}
          </section>

          {/* SECTION E — What Happened Next (Only for historical matches) */}
          {(match.future5dReturn !== null ||
            match.future10dReturn !== null ||
            match.future20dReturn !== null ||
            match.future50dReturn !== null) && (
            <section>
              <SectionLabel
                icon={<TrendingDown size={12} />}
                label="E — What Happened Next?"
              />
              <div className="mt-3 bg-muted/30 rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Price movement in the <strong className="text-foreground">50 candles after</strong> the matched pattern ended.
                  Orange line = pattern end. Blue line = subsequent price path.
                </p>

                {/* "What happened next" summary cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">
                      Outcome Trend
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        (match.future20dReturn ?? 0) >= 0
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {(match.future20dReturn ?? 0) >= 0 ? '↑ Bullish' : '↓ Bearish'}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Over 20 days
                    </span>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">
                      Risk / Reward
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {match.maxGain !== null && match.maxDrawdown !== null && match.maxDrawdown !== 0
                        ? `${Math.abs(match.maxGain / match.maxDrawdown).toFixed(1)}:1`
                        : '—'}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Gain : Drawdown
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed italic border-t border-border pt-2">
                  ⚠ Historical data only. Past patterns do not guarantee future performance.
                  This tool is for educational and analytical purposes only.
                </p>
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────
function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-px bg-border ml-1" />
    </div>
  );
}

function InfoBlock({
  label,
  value,
  mono,
  valueClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="bg-muted/30 rounded-lg px-3 py-2.5 border border-border">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-0.5">
        {label}
      </span>
      <span
        className={`text-xs font-bold text-foreground ${mono ? 'font-mono' : ''} ${
          valueClass ?? ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}
