"use client";

import React, { useState } from 'react';
import SectionHeader from './shared/SectionHeader';
import InfoTooltip from './shared/InfoTooltip';

interface RegimeDetection {
  currentRegime: string;
  daysSpent: number;
  historicalFrequency: number;
  timeline: Array<{
    date: string;
    regime: string;
    volatility: number;
    trendPersistence: number;
    efficiency: number;
    drawdown: number;
  }>;
}

const REGIME_COLORS: Record<string, string> = {
  'Persistent': '#10B981',
  'Balanced': '#6366F1',
  'Transitional': '#F59E0B',
  'Compression': '#A855F7',
  'High Variability': '#EF4444'
};

const REGIME_DESCRIPTIONS: Record<string, { plain: string; what: string }> = {
  'Persistent': {
    plain: 'Price has been moving in a clear direction with momentum. Trend-following indicators are more reliable here.',
    what: 'ADX > 22, Efficiency Ratio > 0.38, Hurst > 0.52'
  },
  'Balanced': {
    plain: 'No clear trend — signals are mixed. Oscillators (RSI, Bollinger) are more useful in this regime.',
    what: 'ADX < 18, Efficiency Ratio < 0.34, Hurst ≤ 0.52'
  },
  'Transitional': {
    plain: 'Market is shifting between regimes. Indicators may send conflicting signals during transitions.',
    what: 'Mid-range values — not qualifying for Persistent or Balanced'
  },
  'Compression': {
    plain: 'Very low volatility and no clear trend. Price is coiling. Energy often releases in a sharp move.',
    what: 'Realized Volatility < 14%, ADX < 18, Drawdown < 5%'
  },
  'High Variability': {
    plain: 'Elevated swings with unpredictable movement. All indicators become less reliable in this regime.',
    what: 'Realized Volatility > 28%, or Drawdown > 12%'
  }
};

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  data: RegimeDetection['timeline'][0] | null;
}

export default function MarketStructureEngine({ regimeDetection }: { regimeDetection: RegimeDetection }) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, data: null });
  const { currentRegime, daysSpent, historicalFrequency, timeline } = regimeDetection;

  const regimeColor = REGIME_COLORS[currentRegime] || '#8B949E';
  const regimeDesc = REGIME_DESCRIPTIONS[currentRegime] || { plain: 'Current market structure.', what: '' };

  // Build timeline segments (compress consecutive same-regime days into segments)
  const segments: Array<{ regime: string; count: number; start: number }> = [];
  timeline.forEach((day, i) => {
    if (segments.length === 0 || segments[segments.length - 1].regime !== day.regime) {
      segments.push({ regime: day.regime, count: 1, start: i });
    } else {
      segments[segments.length - 1].count++;
    }
  });
  const totalDays = timeline.length || 1;

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-5 hover:border-[#30363D] transition-all duration-200">
      <SectionHeader
        label="Section 4 — Market Structure"
        question="What type of market environment is this?"
        accent="indigo"
        tooltipTitle="Market Structure Engine"
        tooltipWhat="Classifies the current market into one of 5 regime types based on volatility, trend strength, and price efficiency."
        tooltipWhy="Different regimes require different analytical approaches. A strategy that works in a trending market fails in a choppy one."
        tooltipHow="Computed from Hurst Exponent, Efficiency Ratio, ADX, Realized Volatility, and Drawdown depth every day."
        tooltipLimitation="Regime classification is backward-looking. It can change quickly when market conditions shift."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Regime Card */}
        <div className="space-y-4">
          <div className="border border-[#21262D] bg-[#0D1117] p-4 space-y-3">
            <div>
              <p className="text-xs text-[#8B949E] uppercase tracking-wider font-bold mb-2">Current Regime</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: regimeColor }} />
                <span className="text-xl font-bold text-white">{currentRegime}</span>
              </div>
              <p className="text-xs text-[#8B949E] leading-relaxed">{regimeDesc.plain}</p>
            </div>

            <div className="border-t border-[#21262D] pt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[#8B949E] uppercase tracking-wider font-bold">Days in Regime</p>
                <p className="text-2xl font-mono font-bold text-white mt-0.5">{daysSpent}</p>
              </div>
              <div>
                <p className="text-xs text-[#8B949E] uppercase tracking-wider font-bold">Historical Freq.</p>
                <p className="text-2xl font-mono font-bold text-white mt-0.5">{historicalFrequency.toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {/* Regime Legend */}
          <div className="border border-[#21262D] p-3 space-y-2">
            <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Regime Guide</p>
            {Object.entries(REGIME_DESCRIPTIONS).map(([regime, info]) => (
              <div key={regime} className={`flex items-start gap-2 ${regime === currentRegime ? 'opacity-100' : 'opacity-50'}`}>
                <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: REGIME_COLORS[regime] }} />
                <div>
                  <p className="text-xs font-bold text-white">{regime}</p>
                  <p className="text-xs text-[#8B949E] leading-normal">{info.plain.split('.')[0]}.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regime Timeline */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Regime Timeline</p>
            <InfoTooltip
              title="Regime Timeline"
              what="Shows how the market regime has evolved over the available data window."
              why="Understanding past regime history tells you how often this type of market occurs and how long it typically lasts."
              how="Each colored segment represents consecutive days in the same regime. Hover for daily detail."
              limitation="Only as reliable as the underlying Hurst Exponent calculation, which requires 80+ days."
            />
          </div>

          {/* Segmented Bar */}
          <div className="relative">
            <div className="flex h-8 overflow-hidden border border-[#21262D]">
              {segments.map((seg, idx) => (
                <div
                  key={idx}
                  className="h-full relative group cursor-pointer hover:opacity-90 transition-opacity duration-150"
                  style={{
                    width: `${(seg.count / totalDays) * 100}%`,
                    backgroundColor: REGIME_COLORS[seg.regime] || '#8B949E',
                    opacity: 0.7
                  }}
                  title={`${seg.regime}: ${seg.count} days`}
                />
              ))}
            </div>
            {/* Labels below */}
            <div className="flex justify-between text-[10px] font-medium text-[#8B949E] mt-1.5">
              <span>{timeline[0]?.date || 'Start'}</span>
              <span>Today</span>
            </div>
          </div>

          {/* Detailed daily timeline — hover interaction */}
          <div className="border border-[#21262D] p-3 space-y-1">
            <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Daily Regime Detail (hover any row)</p>
            <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
              {[...timeline].reverse().slice(0, 30).map((day, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2 py-1 group hover:bg-[#21262D]/50 transition-colors duration-100 cursor-default"
                  onMouseEnter={() => setTooltip({ visible: true, x: 0, y: 0, data: day })}
                  onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, data: null })}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: REGIME_COLORS[day.regime] || '#8B949E' }}
                  />
                  <span className="text-xs font-mono text-[#8B949E] w-24 flex-shrink-0">{day.date}</span>
                  <span className="text-xs font-bold text-white flex-1">{day.regime}</span>
                  <span className="text-[10px] font-mono text-[#8B949E] w-16 text-right">RV:{day.volatility.toFixed(1)}%</span>
                  <span className="text-[10px] font-mono text-[#8B949E] w-16 text-right font-medium">DD:{day.drawdown.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip panel */}
          {tooltip.visible && tooltip.data && (
            <div className="border border-[#6366F1]/30 bg-[#0D1117] p-3 animate-in fade-in duration-150">
              <p className="text-xs font-bold text-[#6366F1] uppercase tracking-wider mb-2">{tooltip.data.date} — {tooltip.data.regime}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#8B949E]">Realized Volatility: </span>
                  <span className="text-white font-mono">{tooltip.data.volatility.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[#8B949E]">Trend Persistence: </span>
                  <span className="text-white font-mono">{tooltip.data.trendPersistence.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-[#8B949E]">Efficiency: </span>
                  <span className="text-white font-mono">{tooltip.data.efficiency.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[#8B949E]">Drawdown: </span>
                  <span className="text-white font-mono">{tooltip.data.drawdown.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
