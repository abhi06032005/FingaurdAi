"use client";

import React, { useState } from 'react';
import SectionHeader from './shared/SectionHeader';
import InfoTooltip from './shared/InfoTooltip';

interface PriceBehaviourProps {
  priceBehaviour: {
    persistence: number;
    strength: number;
    consistency: number;
    recentChange: number;
    contributions: Array<{
      name: string;
      value: number;
      reliability: number;
    }>;
  };
  classicIndicators: {
    rsi: number;
    macd: { line: number; signal: number; histogram: number };
    adx: { adx: number; plusDI: number; minusDI: number };
    bb: { upper: number; mid: number; lower: number; percentB: number; bandwidth: number };
  };
  quantModels: {
    hurstExponent: number;
    efficiencyRatio: number;
  };
  priceSnapshot: {
    close: number;
    zScore: number;
  };
  modelAgreement: {
    groups: Array<{ name: string; score: number; state: string; direction: string; summary: string }>;
    narrative: string;
  };
}

const METRIC_INFO = {
  persistence: {
    title: 'Trend Persistence',
    what: 'How strongly price tends to continue in its current direction.',
    why: 'High persistence means trend-following indicators are more reliable.',
    how: 'Combines Hurst Exponent (0–100) and Efficiency Ratio (0–100). Above 60 = clear trend.',
    limitation: 'Requires 80+ days of data for reliable Hurst estimation.'
  },
  strength: {
    title: 'Trend Strength',
    what: 'How powerful the current price movement is, regardless of direction.',
    why: 'Strong trends are more reliable than weak ones for technical signals.',
    how: 'Derived from ADX (Average Directional Index). ADX above 25 = strong trend.',
    limitation: 'ADX does not indicate direction — only strength.'
  },
  consistency: {
    title: 'Signal Consistency',
    what: 'How much the trend indicators agree with each other.',
    why: 'When multiple independent indicators align, confidence is higher.',
    how: 'Measures agreement across SMA/EMA stack, ADX, Efficiency Ratio, and Hurst Exponent.',
    limitation: 'Can be misleading if all indicators use similar data inputs.'
  },
  zScore: {
    title: 'Price Stretch (Z-Score)',
    what: 'How far price has deviated from its recent 20-day average in statistical units.',
    why: 'Extreme Z-Scores (above +2 or below -2) often precede mean-reversion behaviour.',
    how: 'Z-Score = (Current Price - 20-day Mean) ÷ 20-day Standard Deviation.',
    limitation: 'Works best in balanced/mean-reverting regimes, less useful in strong trends.'
  }
};

function MetricGauge({ label, value, maxValue = 100, color = '#6366F1', info }: {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
  info: typeof METRIC_INFO.persistence;
}) {
  const pct = Math.max(0, Math.min(100, (value / maxValue) * 100));
  const angle = (pct / 100) * 180 - 90; // -90 to +90 degrees

  return (
    <div className="bg-[#0D1117] border border-[#21262D] p-4 flex flex-col items-center space-y-2.5 hover:border-[#30363D] transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-center gap-1.5 w-full justify-between">
        <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">{label}</p>
        <InfoTooltip
          title={info.title}
          what={info.what}
          why={info.why}
          how={info.how}
          limitation={info.limitation}
          currentContext={`${value.toFixed(0)} / ${maxValue}`}
        />
      </div>

      {/* SVG Semicircle Gauge */}
      <svg width="105" height="60" viewBox="0 0 100 56" className="overflow-visible">
        {/* Background arc */}
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#21262D" strokeWidth="8" strokeLinecap="round" />
        {/* Filled arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 125.66} 125.66`}
          opacity="0.85"
        />
        {/* Needle */}
        <circle cx="50" cy="50" r="4" fill="white" />
        <line
          x1="50" y1="50" x2="50" y2="14"
          stroke="white" strokeWidth="1.5" strokeLinecap="round"
          transform={`rotate(${angle} 50 50)`}
          className="transition-transform duration-700 ease-out"
        />
        {/* Value */}
        <text x="50" y="52" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="monospace">
          {value.toFixed(0)}
        </text>
      </svg>

      <p className="text-xs text-[#8B949E] text-center font-medium leading-tight">
        {value >= 70 ? 'Strong' : value >= 45 ? 'Moderate' : 'Weak'}
      </p>
    </div>
  );
}

function WaterfallBar({ name, value, reliability }: { name: string; value: number; reliability: number }) {
  const isPositive = value >= 0;
  const absVal = Math.abs(value);
  const maxVal = 0.35; // expected max contribution
  const barWidth = Math.min(100, (absVal / maxVal) * 100);

  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <div className="w-32 flex-shrink-0">
        <p className="text-xs font-bold text-white truncate">{name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="h-0.5 w-10 bg-[#21262D]">
            <div className="h-full bg-[#6366F1]" style={{ width: `${reliability}%` }} />
          </div>
          <span className="text-[9px] text-[#8B949E] font-medium">R:{reliability}</span>
        </div>
      </div>
      <div className="flex-1 relative h-4 flex items-center">
        <div className="absolute left-0 right-0 h-0.5 bg-[#21262D]" />
        <div
          className={`absolute h-4 ${isPositive ? 'bg-[#6366F1]/60 left-1/2' : 'bg-[#F59E0B]/60 right-1/2'} transition-all duration-500`}
          style={{ width: `${barWidth / 2}%` }}
        />
        <div className="absolute left-1/2 w-0.5 h-full bg-[#8B949E]/30" />
      </div>
      <span className={`text-xs font-mono font-bold w-16 text-right ${isPositive ? 'text-[#6366F1]' : 'text-[#F59E0B]'}`}>
        {isPositive ? '+' : ''}{value.toFixed(3)}
      </span>
    </div>
  );
}

export default function PriceBehaviourEngine({ priceBehaviour, classicIndicators, quantModels, priceSnapshot, modelAgreement }: PriceBehaviourProps) {
  const [expanded, setExpanded] = useState(false);

  const rsiLabel = classicIndicators.rsi > 70 ? 'Stretched High' : classicIndicators.rsi < 30 ? 'Stretched Low' : 'Neutral Range';
  const macdLabel = classicIndicators.macd.histogram > 0 ? 'Positive Momentum' : 'Negative Momentum';
  const trendGroup = modelAgreement?.groups?.find(g => g.name === 'Trend');
  const momentumGroup = modelAgreement?.groups?.find(g => g.name === 'Momentum');

  const zScoreDisplayVal = ((priceSnapshot.zScore + 3) / 6) * 100;

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-5 hover:border-[#30363D] transition-all duration-200">
      <SectionHeader
        label="Section 2 — Price Behaviour"
        question="How has price been moving recently?"
        accent="indigo"
        tooltipTitle="Price Behaviour Engine"
        tooltipWhat="Combines 7 different price-based measurements into one unified view of how price has been behaving."
        tooltipWhy="Instead of showing 7 disconnected gauges, this engine synthesizes them into 4 clear dimensions: persistence, strength, consistency, and statistical position."
        tooltipHow="RSI, MACD, EMAs, SMAs, Hurst Exponent, Efficiency Ratio, and Z-Score are combined into category scores."
        tooltipLimitation="No single engine captures all market complexity. Use this as context, not a signal."
      />

      {/* 4 Metric Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <MetricGauge
          label="Persistence"
          value={priceBehaviour.persistence}
          color="#6366F1"
          info={METRIC_INFO.persistence}
        />
        <MetricGauge
          label="Strength"
          value={priceBehaviour.strength}
          color="#10B981"
          info={METRIC_INFO.strength}
        />
        <MetricGauge
          label="Consistency"
          value={priceBehaviour.consistency}
          color="#F59E0B"
          info={METRIC_INFO.consistency}
        />
        <MetricGauge
          label="Price Stretch"
          value={Math.max(0, Math.min(100, zScoreDisplayVal))}
          color={priceSnapshot.zScore > 1.5 ? '#EF4444' : priceSnapshot.zScore < -1.5 ? '#EF4444' : '#8B949E'}
          info={METRIC_INFO.zScore}
        />
      </div>

      {/* Quick Facts Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
        {[
          { label: 'RSI (14)', value: classicIndicators.rsi.toFixed(1), state: rsiLabel, color: classicIndicators.rsi > 70 || classicIndicators.rsi < 30 ? 'text-[#F59E0B]' : 'text-white' },
          { label: 'MACD Signal', value: classicIndicators.macd.histogram.toFixed(3), state: macdLabel, color: classicIndicators.macd.histogram > 0 ? 'text-emerald-400' : 'text-rose-400' },
          { label: 'Hurst Exponent', value: quantModels.hurstExponent.toFixed(3), state: quantModels.hurstExponent > 0.55 ? 'Trending memory' : quantModels.hurstExponent < 0.45 ? 'Mean-reverting' : 'Random walk', color: 'text-[#6366F1]' },
          { label: 'Efficiency Ratio', value: quantModels.efficiencyRatio.toFixed(3), state: quantModels.efficiencyRatio > 0.4 ? 'Efficient trend' : 'Choppy movement', color: 'text-[#8B949E]' }
        ].map((item) => (
          <div key={item.label} className="bg-[#0D1117] border border-[#21262D] px-3 py-2">
            <p className="text-xs text-[#8B949E] uppercase tracking-wider font-bold mb-1">{item.label}</p>
            <p className={`text-sm font-mono font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-[#8B949E] mt-0.5">{item.state}</p>
          </div>
        ))}
      </div>

      {/* Model Agreement Narrative */}
      {modelAgreement && (
        <div className="bg-[#0D1117] border border-[#21262D] px-4 py-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[#6366F1] uppercase tracking-wider">Cross-Model Agreement</span>
            <div className="flex-1 h-px bg-[#21262D]" />
          </div>
          <p className="text-xs text-white leading-relaxed">{modelAgreement.narrative}</p>
        </div>
      )}

      {/* Waterfall Contribution Chart */}
      <div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 text-xs font-bold text-[#8B949E] uppercase tracking-wider hover:text-white transition-colors duration-150 mb-2 cursor-pointer"
        >
          <span className="w-3.5 h-3.5 border border-[#8B949E] flex items-center justify-center text-[9px]">{expanded ? '−' : '+'}</span>
          Indicator Contributions Breakdown
        </button>
        {expanded && (
          <div className="border border-[#21262D] p-3 space-y-0.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-2 text-[10px] text-[#8B949E] font-medium">
              <span className="text-[#F59E0B]">◀ Negative weight</span>
              <div className="flex-1 text-center">Center = 0</div>
              <span className="text-[#6366F1]">Positive weight ▶</span>
            </div>
            {priceBehaviour.contributions.map((c) => (
              <WaterfallBar key={c.name} name={c.name} value={c.value} reliability={c.reliability} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
