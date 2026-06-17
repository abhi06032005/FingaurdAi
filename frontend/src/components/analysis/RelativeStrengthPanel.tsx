"use client";

import React from 'react';
import SectionHeader from './shared/SectionHeader';
import InfoTooltip from './shared/InfoTooltip';

interface RelativeStrength {
  performance: {
    5: number;
    20: number;
    60: number;
    120: number;
  };
  percentiles: {
    rank5d: number;
    rank20d: number;
    rank60d: number;
    rank120d: number;
  };
  sectorComparison: {
    sectorName: string;
    avg5d: number;
    avg20d: number;
    avg60d: number;
    avg120d: number;
  };
}

interface RelativeStrengthPanelProps {
  relativeStrength: RelativeStrength;
  ticker: string;
}

const WINDOWS = [
  { key: '5' as const, label: '5D', rankKey: 'rank5d' as const, sectorKey: 'avg5d' as const },
  { key: '20' as const, label: '20D', rankKey: 'rank20d' as const, sectorKey: 'avg20d' as const },
  { key: '60' as const, label: '60D', rankKey: 'rank60d' as const, sectorKey: 'avg60d' as const },
  { key: '120' as const, label: '120D', rankKey: 'rank120d' as const, sectorKey: 'avg120d' as const },
];

function ReturnCell({ value, rank }: { value: number; rank: number }) {
  const isPos = value >= 0;
  let rankColor = 'text-[#8B949E]';
  if (rank >= 70) rankColor = 'text-emerald-400';
  else if (rank >= 50) rankColor = 'text-[#6366F1]';
  else if (rank < 30) rankColor = 'text-rose-400';

  return (
    <div className="text-right">
      <p className={`text-xs font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPos ? '+' : ''}{value.toFixed(1)}%
      </p>
      <p className={`text-[10px] font-semibold ${rankColor}`}>
        P{rank.toFixed(0)}
      </p>
    </div>
  );
}

export default function RelativeStrengthPanel({ relativeStrength, ticker }: RelativeStrengthPanelProps) {
  const cleanTicker = ticker.replace('.NS', '');
  const { performance, percentiles, sectorComparison } = relativeStrength;

  const avgRank = (
    (percentiles.rank5d + percentiles.rank20d + percentiles.rank60d + percentiles.rank120d) / 4
  );

  let rankLabel = 'Lagging peers';
  let rankColor = 'text-rose-400';
  if (avgRank >= 70) { rankLabel = 'Leading peers'; rankColor = 'text-emerald-400'; }
  else if (avgRank >= 50) { rankLabel = 'In line with peers'; rankColor = 'text-[#6366F1]'; }

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-5 h-full hover:border-[#30363D] transition-all duration-200">
      <SectionHeader
        label="Section 5b — Relative Strength"
        question={`How has ${cleanTicker} compared to NIFTY 50?`}
        accent="emerald"
        tooltipTitle="Relative Strength"
        tooltipWhat="Compares this stock's returns to all other NIFTY 50 stocks over multiple time windows."
        tooltipWhy="Stocks consistently outperforming peers are showing relative leadership — a sign of relative strength."
        tooltipHow="Returns for 5d, 20d, 60d, 120d windows are ranked percentile-wise against all 50 stocks."
        tooltipLimitation="Past relative outperformance does not guarantee future leadership."
      />

      {/* Average Rank */}
      <div className="bg-[#0D1117] border border-[#21262D] px-4 py-3 mb-4 text-center">
        <p className="text-xs text-[#8B949E] uppercase tracking-wider font-bold mb-1">Avg Percentile Rank</p>
        <p className={`text-3xl font-mono font-bold ${rankColor}`}>{avgRank.toFixed(0)}</p>
        <p className={`text-xs font-semibold ${rankColor}`}>{rankLabel}</p>
      </div>

      {/* Performance Table */}
      <div className="space-y-1 mb-4">
        {WINDOWS.map(w => {
          const ret = performance[w.key];
          const rank = percentiles[w.rankKey];
          const secAvg = sectorComparison[w.sectorKey];
          const vsSecAvg = ret - secAvg;
          const barWidth = Math.min(100, rank);

          return (
            <div key={w.key} className="flex items-center gap-3 py-2 border-b border-[#21262D]/50 last:border-0">
              <span className="text-xs font-mono font-bold text-[#8B949E] w-8 flex-shrink-0">{w.label}</span>
              <div className="flex-1 space-y-1">
                <div className="w-full h-1 bg-[#21262D]">
                  <div
                    className={`h-full transition-all duration-700 ${rank >= 70 ? 'bg-emerald-500' : rank >= 50 ? 'bg-[#6366F1]' : 'bg-rose-500'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#8B949E] font-medium">
                  <span>Sector avg: {secAvg >= 0 ? '+' : ''}{secAvg.toFixed(1)}%</span>
                  <span>vs sector: {vsSecAvg >= 0 ? '+' : ''}{vsSecAvg.toFixed(1)}%</span>
                </div>
              </div>
              <ReturnCell value={ret} rank={rank} />
            </div>
          );
        })}
      </div>

      {/* Sector context */}
      <div className="bg-[#0D1117] border border-[#21262D] px-3 py-2">
        <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-1">Sector Context</p>
        <p className="text-xs text-white font-bold">{sectorComparison.sectorName}</p>
        <p className="text-xs text-[#8B949E] leading-relaxed mt-0.5">
          {avgRank >= 60
            ? 'Outperforming sector peers across most windows'
            : avgRank <= 40
              ? 'Underperforming sector peers across most windows'
              : 'In line with sector peer average'}
        </p>
      </div>

      <p className="text-[10px] text-[#8B949E]/70 mt-3 italic leading-relaxed">
        Percentile ranks are vs NIFTY 50 peers. P70+ = top 30% performer.
      </p>
    </div>
  );
}
