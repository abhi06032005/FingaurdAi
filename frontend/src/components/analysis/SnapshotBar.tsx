"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import InfoTooltip from './shared/InfoTooltip';

interface SnapshotBarProps {
  ticker: string;
  companyName?: string;
  asOf: string;
  dataWindowDays: number;
  close: number;
  priceChange?: number;
  priceChangePct?: number;
  percentileRank: number;
  zScore: number;
  currentRegime: string;
  confidenceScore: { score: number };
}

const REGIME_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; desc: string }> = {
  'Persistent': {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'Persistent',
    desc: 'Price moving in a clear direction with momentum'
  },
  'Balanced': {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    label: 'Balanced',
    desc: 'No dominant trend — mixed signals across indicators'
  },
  'Transitional': {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'Transitional',
    desc: 'Market structure shifting — indicators mixed'
  },
  'Compression': {
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    label: 'Compression',
    desc: 'Low volatility — price coiling before next move'
  },
  'High Variability': {
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    label: 'High Variability',
    desc: 'Elevated swings — unpredictable short-term movement'
  }
};

function PercentileBar({ value }: { value: number }) {
  const clampedValue = Math.max(0, Math.min(100, value));
  let barColor = 'bg-rose-500';
  if (clampedValue >= 67) barColor = 'bg-[#6366F1]';
  else if (clampedValue >= 34) barColor = 'bg-amber-500';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-[#8B949E] uppercase tracking-wider font-bold">Price Position</span>
        <span className="text-xs font-mono font-bold text-white">{clampedValue.toFixed(0)}th percentile</span>
      </div>
      <div className="relative h-1.5 w-full bg-[#21262D] overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[#8B949E] font-medium">
        <span>Bottom of range</span>
        <span>Top of range</span>
      </div>
    </div>
  );
}

function ConfidencePill({ score }: { score: number }) {
  let color = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  if (score >= 70) color = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  else if (score >= 50) color = 'text-amber-400 border-amber-500/30 bg-amber-500/10';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-bold font-mono ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      CONFIDENCE {score}/100
    </div>
  );
}

export default function SnapshotBar({
  ticker,
  companyName,
  asOf,
  dataWindowDays,
  close,
  priceChange = 0,
  priceChangePct = 0,
  percentileRank,
  zScore,
  currentRegime,
  confidenceScore
}: SnapshotBarProps) {
  const cleanTicker = ticker.replace('.NS', '');
  const regime = REGIME_CONFIG[currentRegime] || REGIME_CONFIG['Balanced'];
  const isPositive = priceChange >= 0;
  const isFlat = Math.abs(priceChangePct) < 0.05;

  const TrendIcon = isFlat ? Minus : isPositive ? TrendingUp : TrendingDown;
  const changeColor = isFlat ? 'text-[#8B949E]' : isPositive ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className="bg-[#161B22] border-b border-[#21262D]">
      {/* Navigation row */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        <Link
          href="/analysis"
          className="inline-flex items-center gap-1.5 text-xs text-[#8B949E] hover:text-white uppercase tracking-wider font-bold transition-colors duration-150"
        >
          <ArrowLeft size={11} />
          All Stocks
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#8B949E] border border-[#21262D] bg-[#0D1117] px-2 py-0.5">
            {dataWindowDays}D DATA
          </span>
          <span className="text-xs font-mono text-[#8B949E]">
            AS OF {asOf}
          </span>
        </div>
      </div>

      {/* Main snapshot row */}
      <div className="px-6 pb-5">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">

          {/* 1. Ticker + Price */}
          <div className="lg:col-span-2 space-y-3">
            <div>
              <div className="flex items-baseline gap-3 mb-1">
                <h1 className="text-3xl font-bold font-mono text-white tracking-tight">{cleanTicker}</h1>
                {companyName && (
                  <span className="text-sm text-[#8B949E] font-sans truncate max-w-[200px]">{companyName}</span>
                )}
              </div>
              <p className="text-xs text-[#8B949E] font-sans uppercase tracking-wider">NSE Listed · NIFTY 50</p>
            </div>

            <div className="flex items-end gap-4">
              <div>
                <p className="text-xs text-[#8B949E] uppercase tracking-wider font-bold mb-1">Last Price</p>
                <p className="text-4xl font-mono font-bold text-white tracking-tight">
                  ₹{close.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`flex items-center gap-1.5 pb-1 ${changeColor}`}>
                <TrendIcon size={14} />
                <span className="text-sm font-mono font-bold">
                  {isPositive && !isFlat ? '+' : ''}{priceChange.toFixed(2)}
                </span>
                <span className="text-xs font-mono">
                  ({isPositive && !isFlat ? '+' : ''}{priceChangePct.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* 2. Price Percentile */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-xs text-[#8B949E] uppercase tracking-wider font-bold">Range Position</p>
              <InfoTooltip
                title="Price Percentile Rank"
                what="Shows where today's price sits within the last 300 trading days."
                why="Helps you understand if the price is high or low compared to recent history."
                how="100th percentile means at the highest point in the window. 0th means at the lowest. 50th is the middle."
                limitation="Uses closing prices only. Window is limited to available data."
                currentContext={`${percentileRank.toFixed(0)}th percentile of ${dataWindowDays}-day range`}
              />
            </div>
            <PercentileBar value={percentileRank} />
          </div>

          {/* 3. Market Regime */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-xs text-[#8B949E] uppercase tracking-wider font-bold">Market Regime</p>
              <InfoTooltip
                title="Market Regime"
                what="A classification of the current market state based on trend strength, volatility, and price efficiency."
                why="Knowing the regime helps you understand which type of indicator is most relevant — trend-following in Persistent, oscillators in Balanced."
                how="Computed from ADX (trend strength), Hurst Exponent (price memory), Efficiency Ratio (price smoothness), and Realized Volatility."
                limitation="Regime can change quickly. It reflects recent conditions, not a forecast."
                currentContext={`${currentRegime} — ${regime.desc}`}
              />
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-2 border ${regime.bg} ${regime.border}`}>
              <span className={`w-2 h-2 rounded-full bg-current ${regime.color}`} />
              <span className={`text-sm font-bold ${regime.color}`}>{regime.label}</span>
            </div>
            <p className="text-xs text-[#8B949E] leading-relaxed">{regime.desc}</p>
          </div>

          {/* 4. Confidence Score */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-xs text-[#8B949E] uppercase tracking-wider font-bold">Model Confidence</p>
              <InfoTooltip
                title="Confidence Score"
                what="Measures how consistently the analytical models agree with each other today."
                why="When models disagree, the analysis is less reliable. A high score means multiple independent methods are pointing in the same direction."
                how="Weighted from: model agreement (30%), regime stability (20%), data sufficiency (20%), volatility consistency (15%), model reliability (15%)."
                limitation="High confidence does not mean the stock will perform well. It means the analytical signals are consistent."
                currentContext={`${confidenceScore.score}/100`}
              />
            </div>
            <ConfidencePill score={confidenceScore.score} />
            <p className="text-xs text-[#8B949E] leading-relaxed mt-1">
              {confidenceScore.score >= 70
                ? 'Models broadly aligned — analysis is internally consistent'
                : confidenceScore.score >= 50
                  ? 'Models partially aligned — some disagreement present'
                  : 'Models diverging — treat signals with caution'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
