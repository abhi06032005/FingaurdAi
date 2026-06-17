"use client";

import React, { useState } from 'react';
import SectionHeader from './shared/SectionHeader';

interface Analog {
  date: string;
  similarity: number;
  marketStructure: string;
  sub5dReturn: number;
  sub20dReturn: number;
  volatilityChange: number;
  subsequentDrawdown: number;
}

interface HistoricalAnalogEngineProps {
  analogs: Analog[];
}

const REGIME_COLORS: Record<string, string> = {
  'Persistent': '#10B981',
  'Balanced': '#6366F1',
  'Transitional': '#F59E0B',
  'Compression': '#A855F7',
  'High Variability': '#EF4444'
};

function ReturnBar({ value, maxAbs }: { value: number; maxAbs: number }) {
  const clampedMax = maxAbs || 1;
  const width = Math.min(100, Math.abs(value / clampedMax) * 100);
  const isPos = value >= 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-2 bg-[#21262D] overflow-hidden relative">
        <div
          className={`absolute top-0 h-full ${isPos ? 'left-1/2 bg-emerald-500/70' : 'right-1/2 bg-rose-500/70'}`}
          style={{ width: `${width / 2}%` }}
        />
        <div className="absolute left-1/2 w-px h-full bg-[#8B949E]/30" />
      </div>
      <span className={`text-xs font-mono font-bold min-w-[44px] ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPos ? '+' : ''}{value.toFixed(1)}%
      </span>
    </div>
  );
}

export default function HistoricalAnalogEngine({ analogs }: HistoricalAnalogEngineProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!analogs || analogs.length === 0) {
    return (
      <div className="bg-[#161B22] border border-[#21262D] p-5">
        <SectionHeader label="Section 5 — Historical Context" question="When has the market looked like this before?" accent="amber" />
        <p className="text-xs text-[#8B949E]">Not enough data to compute historical analogs. Requires at least 40 trading days.</p>
      </div>
    );
  }

  const maxAbsReturn = Math.max(...analogs.flatMap(a => [Math.abs(a.sub5dReturn), Math.abs(a.sub20dReturn)]));

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-5 hover:border-[#30363D] transition-all duration-200">
      <SectionHeader
        label="Section 5 — Historical Context"
        question="When has the market looked like this before?"
        accent="amber"
        tooltipTitle="Historical Analog Engine"
        tooltipWhat="Finds past moments in the same stock's history where the analytical measurements were most similar to today."
        tooltipWhy="Historical context helps you understand how the market behaved in similar past situations."
        tooltipHow="Compares 12 measurements (RSI, MACD, ADX, ATR, Hurst, Efficiency, Volatility, Drawdown, Z-Score, Percentile, Volume Ratio, Confluence) using cosine similarity."
        tooltipLimitation="Past behaviour does not predict future performance. This is historical context only — not a forecast."
      />

      {/* Disclaimer */}
      <div className="border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-3 py-2.5 mb-4">
        <p className="text-xs text-[#F59E0B] font-bold">
          ⚠ Historical context only. Past market behaviour does not predict future price performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Analog Cards */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Top Similar Historical Moments</p>
          {analogs.slice(0, 5).map((analog, idx) => {
            const regimeColor = REGIME_COLORS[analog.marketStructure] || '#8B949E';
            const isSelected = selectedIdx === idx;

            return (
              <button
                key={idx}
                onClick={() => setSelectedIdx(isSelected ? null : idx)}
                className={`w-full text-left border transition-all duration-200 p-3 cursor-pointer ${
                  isSelected
                    ? 'border-[#6366F1] bg-[#6366F1]/5'
                    : 'border-[#21262D] bg-[#0D1117] hover:border-[#30363D]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">{analog.date}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5"
                      style={{ color: regimeColor, backgroundColor: `${regimeColor}20`, border: `1px solid ${regimeColor}40` }}
                    >
                      {analog.marketStructure}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#6366F1] font-mono">{analog.similarity.toFixed(1)}%</span>
                    <p className="text-[9px] font-medium text-[#8B949E] leading-none mt-0.5">similarity</p>
                  </div>
                </div>

                {/* Similarity bar */}
                <div className="w-full h-0.5 bg-[#21262D] mb-2">
                  <div className="h-full bg-[#6366F1]/70" style={{ width: `${analog.similarity}%` }} />
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-[#8B949E]">What followed (5d): </span>
                    <span className={analog.sub5dReturn >= 0 ? 'text-emerald-400 font-mono font-bold' : 'text-rose-400 font-mono font-bold'}>
                      {analog.sub5dReturn >= 0 ? '+' : ''}{analog.sub5dReturn.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8B949E]">20d: </span>
                    <span className={analog.sub20dReturn >= 0 ? 'text-emerald-400 font-mono font-bold' : 'text-rose-400 font-mono font-bold'}>
                      {analog.sub20dReturn >= 0 ? '+' : ''}{analog.sub20dReturn.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Analog Detail */}
        <div>
          {selectedIdx !== null && analogs[selectedIdx] ? (
            <div className="border border-[#6366F1]/30 bg-[#6366F1]/5 p-4 space-y-4 animate-in fade-in duration-200">
              <div>
                <p className="text-xs font-bold text-[#6366F1] uppercase tracking-wider mb-1">
                  Historical Detail — {analogs[selectedIdx].date}
                </p>
                <p className="text-xs text-white font-bold">{analogs[selectedIdx].similarity.toFixed(1)}% match to today</p>
                <p className="text-xs text-[#8B949E] mt-1">
                  Regime was <strong className="text-white">{analogs[selectedIdx].marketStructure}</strong>
                </p>
              </div>

              {/* What followed */}
              <div>
                <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2.5">What happened after this moment</p>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-xs text-[#8B949E] mb-1">5-Day price change after this date</p>
                    <ReturnBar value={analogs[selectedIdx].sub5dReturn} maxAbs={maxAbsReturn} />
                  </div>
                  <div>
                    <p className="text-xs text-[#8B949E] mb-1">20-Day price change after this date</p>
                    <ReturnBar value={analogs[selectedIdx].sub20dReturn} maxAbs={maxAbsReturn} />
                  </div>
                  <div className="flex gap-4 text-xs pt-1">
                    <div>
                      <span className="text-[#8B949E]">Max Drawdown after: </span>
                      <span className="text-rose-400 font-mono font-bold">-{analogs[selectedIdx].subsequentDrawdown.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-[#8B949E]">Volatility change: </span>
                      <span className={`font-mono font-bold ${analogs[selectedIdx].volatilityChange > 0 ? 'text-[#F59E0B]' : 'text-emerald-400'}`}>
                        {analogs[selectedIdx].volatilityChange >= 0 ? '+' : ''}{analogs[selectedIdx].volatilityChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#21262D] pt-3">
                <p className="text-[10px] text-[#8B949E]/80 italic leading-relaxed">
                  This shows what happened after a historically similar moment in this stock. It is historical context only and must not be interpreted as a prediction of future performance.
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-[#21262D] bg-[#0D1117] p-4 h-full flex items-center justify-center min-h-[200px]">
              <p className="text-xs text-[#8B949E] text-center leading-relaxed">
                Click an analog card to see what happened after that historical moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
