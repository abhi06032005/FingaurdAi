"use client";

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import SectionHeader from './shared/SectionHeader';
import InfoTooltip from './shared/InfoTooltip';

interface DailyDelta {
  biggestIncrease: { name: string; val: number; formatted: string } | null;
  biggestDecrease: { name: string; val: number; formatted: string } | null;
  deltas: {
    rsi: number;
    macd: number;
    adx: number;
    volatility: number;
    volumeRatio: number;
    confluence: number;
    drawdown: number;
    structure: number;
  };
}

interface WhatChangedPanelProps {
  dailyDelta: DailyDelta;
}

const DELTA_CONFIG: Record<string, { label: string; unit: string; desc: (v: number) => string }> = {
  rsi: {
    label: 'Momentum (RSI)',
    unit: 'pts',
    desc: (v) => v > 2 ? 'Momentum strengthened' : v < -2 ? 'Momentum weakened' : 'Momentum stable'
  },
  macd: {
    label: 'MACD Signal',
    unit: '',
    desc: (v) => v > 0 ? 'Momentum signal expanding' : v < 0 ? 'Momentum signal contracting' : 'Signal unchanged'
  },
  adx: {
    label: 'Trend Strength (ADX)',
    unit: 'pts',
    desc: (v) => v > 1 ? 'Trend strengthening' : v < -1 ? 'Trend weakening' : 'Trend strength stable'
  },
  volatility: {
    label: 'Realized Volatility',
    unit: '%',
    desc: (v) => v > 1 ? 'Volatility increased' : v < -1 ? 'Volatility decreased' : 'Volatility unchanged'
  },
  volumeRatio: {
    label: 'Volume vs Average',
    unit: 'x',
    desc: (v) => v > 0.1 ? 'Volume increased vs average' : v < -0.1 ? 'Volume decreased vs average' : 'Volume near average'
  },
  confluence: {
    label: 'Model Agreement',
    unit: '',
    desc: (v) => v > 0.05 ? 'Models more aligned' : v < -0.05 ? 'Models less aligned' : 'Agreement unchanged'
  },
  drawdown: {
    label: 'Drawdown Depth',
    unit: '%',
    desc: (v) => v > 0.5 ? 'Pullback deepened' : v < -0.5 ? 'Drawdown recovered' : 'Drawdown stable'
  },
  structure: {
    label: 'Market Regime',
    unit: '',
    desc: (v) => v !== 0 ? 'Regime classification changed' : 'Regime unchanged'
  }
};

function DeltaRow({ name, value }: { name: string; value: number }) {
  const config = DELTA_CONFIG[name.toLowerCase()] || { label: name, unit: '', desc: () => '' };
  const absVal = Math.abs(value);
  const isPositive = value > 0.001;
  const isNegative = value < -0.001;
  const isFlat = !isPositive && !isNegative;

  const barWidth = Math.min(100, absVal * 20); // scale for display
  const barColor = isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-[#8B949E]';

  return (
    <div className="group flex items-center gap-3 py-2.5 border-b border-[#21262D]/50 last:border-0 hover:bg-[#21262D]/30 transition-colors duration-150 px-2 -mx-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{config.label}</p>
        <p className="text-[11px] text-[#8B949E] truncate">{config.desc(value)}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Mini bar */}
        <div className="w-16 h-1 bg-[#21262D] overflow-hidden">
          <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${barWidth}%` }} />
        </div>
        {/* Value */}
        <div className={`flex items-center gap-0.5 text-xs font-mono font-bold min-w-[56px] justify-end ${isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-[#8B949E]'}`}>
          {isPositive ? <TrendingUp size={10} /> : isNegative ? <TrendingDown size={10} /> : <Minus size={10} />}
          <span>{isPositive ? '+' : ''}{name === 'structure' ? (value !== 0 ? 'changed' : 'same') : value.toFixed(name === 'macd' ? 3 : 1)}{config.unit}</span>
        </div>
      </div>
    </div>
  );
}

export default function WhatChangedPanel({ dailyDelta }: WhatChangedPanelProps) {
  const deltaEntries = Object.entries(dailyDelta.deltas);
  const sortedByMagnitude = [...deltaEntries].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  const biggest = sortedByMagnitude[0];
  const biggestConfig = biggest ? DELTA_CONFIG[biggest[0].toLowerCase()] : null;

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-5 hover:border-[#30363D] transition-all duration-200">
      <SectionHeader
        label="Daily Change"
        question="What shifted since yesterday?"
        accent="amber"
        tooltipTitle="Daily Delta Panel"
        tooltipWhat="Shows how key analytical measurements changed since the previous trading session."
        tooltipWhy="Helps you understand why today's dashboard looks different from yesterday — isolates the most significant signal changes."
        tooltipHow="Each metric is compared to its previous-day value. Positive = increased since yesterday. Negative = decreased."
        tooltipLimitation="Based on closing prices only. Intraday shifts are not captured."
      />

      {/* Headline shift */}
      {biggest && biggestConfig && (
        <div className={`mb-4.5 p-3.5 border ${Math.abs(biggest[1]) > 0.001 && biggest[1] > 0 ? 'border-emerald-500/20 bg-emerald-500/5' : Math.abs(biggest[1]) > 0.001 ? 'border-rose-500/20 bg-rose-500/5' : 'border-[#21262D] bg-[#0D1117]'}`}>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B949E] mb-1">Biggest Shift Today</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold font-mono ${biggest[1] > 0 ? 'text-emerald-400' : biggest[1] < 0 ? 'text-rose-400' : 'text-[#8B949E]'}`}>
              {biggest[1] > 0 ? '+' : ''}{biggest[1].toFixed(2)}
            </span>
            <span className="text-xs text-white font-bold">{biggestConfig.label}</span>
          </div>
          <p className="text-xs text-[#8B949E] mt-0.5">{biggestConfig.desc(biggest[1])}</p>
        </div>
      )}

      {/* Full delta list */}
      <div>
        {sortedByMagnitude.map(([name, value]) => (
          <DeltaRow key={name} name={name} value={value} />
        ))}
      </div>

      <p className="text-[10px] text-[#8B949E]/70 mt-3 italic leading-relaxed">
        Changes relative to the previous trading session's closing values.
      </p>
    </div>
  );
}
