"use client";

import React from 'react';
import SectionHeader from './shared/SectionHeader';
import InfoTooltip from './shared/InfoTooltip';

interface VolumeBehaviourProps {
  volumeBehaviour: {
    pressure: number;
    participationTrend: Array<{ date: string; ratio: number; volume: number }>;
    context: {
      volumeRatio: number;
      obvSlope: number;
      vwapDistancePct: number;
      participationRank: number;
      pointOfControlDistance: number;
    };
  };
  quantModels: {
    volumeProfile: {
      profile: Array<{ priceLevel: number; low: number; high: number; volumePct: number }>;
      pointOfControl: number;
    };
  };
  classicIndicators: {
    obv: number;
    obvSlope?: string;
    volumeRatio: number;
    vwap?: number;
    vwapDistancePct?: number;
  };
  currentPrice: number;
}

function VolumePressureGauge({ value }: { value: number }) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const angle = (clampedValue / 100) * 180 - 90;

  let color = '#8B949E';
  let label = 'Neutral';
  if (clampedValue >= 70) { color = '#6366F1'; label = 'High Pressure'; }
  else if (clampedValue >= 55) { color = '#10B981'; label = 'Elevated'; }
  else if (clampedValue <= 35) { color = '#F59E0B'; label = 'Low Activity'; }
  else if (clampedValue <= 20) { color = '#EF4444'; label = 'Very Low'; }

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Volume Pressure</p>
        <InfoTooltip
          title="Volume Pressure Gauge"
          what="Measures how strongly the current volume activity is supporting or contradicting price movement."
          why="Volume is the fuel behind price moves. Rising price on high volume is more credible than rising price on low volume."
          how="Combines Volume Ratio (vs 20-day average), OBV slope direction, and VWAP distance."
          limitation="Volume data quality varies. Low-quality volume data reduces the reliability of this gauge."
          currentContext={`${clampedValue}/100 — ${label}`}
        />
      </div>
      <svg width="160" height="88" viewBox="0 0 160 88" className="overflow-visible">
        {/* Background arc */}
        <path d="M 16 78 A 64 64 0 0 1 144 78" fill="none" stroke="#21262D" strokeWidth="12" strokeLinecap="round" />
        {/* Zones */}
        <path d="M 16 78 A 64 64 0 0 1 54 22" fill="none" stroke="#EF4444" strokeWidth="12" strokeLinecap="butt" opacity="0.15" />
        <path d="M 54 22 A 64 64 0 0 1 80 14" fill="none" stroke="#F59E0B" strokeWidth="12" strokeLinecap="butt" opacity="0.15" />
        <path d="M 80 14 A 64 64 0 0 1 106 22" fill="none" stroke="#8B949E" strokeWidth="12" strokeLinecap="butt" opacity="0.15" />
        <path d="M 106 22 A 64 64 0 0 1 144 78" fill="none" stroke="#6366F1" strokeWidth="12" strokeLinecap="butt" opacity="0.15" />
        {/* Filled arc */}
        <path
          d="M 16 78 A 64 64 0 0 1 144 78"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(clampedValue / 100) * 201.06} 201.06`}
          opacity="0.9"
        />
        {/* Needle */}
        <circle cx="80" cy="78" r="6" fill="white" />
        <line
          x1="80" y1="78" x2="80" y2="22"
          stroke="white" strokeWidth="2" strokeLinecap="round"
          transform={`rotate(${angle} 80 78)`}
          style={{ transition: 'transform 0.7s ease-out' }}
        />
        {/* Score */}
        <text x="80" y="73" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="monospace">{clampedValue}</text>
      </svg>
      <p className="text-sm font-bold" style={{ color }}>{label}</p>
    </div>
  );
}

function ParticipationSparkline({ data }: { data: Array<{ date: string; ratio: number }> }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.ratio);
  const max = Math.max(...vals, 2);
  const min = 0;
  const range = max - min || 1;
  const width = 300;
  const height = 50;

  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  const avgLine = height - ((1 - min) / range) * height;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Participation Trend (30d)</p>
        <InfoTooltip
          title="Volume Participation Trend"
          what="Shows how today's volume compares to the 20-day average over the past 30 days."
          why="Consistently rising participation suggests accumulation or distribution activity."
          how="Each bar = today's volume ÷ 20-day average volume. 1.0x is the baseline (average)."
          limitation="Single-day spikes can distort the trend. Look at the overall direction, not individual days."
        />
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path d={areaPath} fill="rgba(99,102,241,0.08)" />
        <path d={linePath} fill="none" stroke="#6366F1" strokeWidth="1.5" />
        <line x1="0" y1={avgLine} x2={width} y2={avgLine} stroke="#8B949E" strokeWidth="0.5" strokeDasharray="3,3" />
      </svg>
      <div className="flex justify-between text-[10px] font-mono text-[#8B949E] mt-0.5 font-medium">
        <span>30 days ago</span>
        <span className="text-[#6366F1]">1.0x = average</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function VolumeProfileHistogram({ profile, pointOfControl, currentPrice }: {
  profile: Array<{ priceLevel: number; low: number; high: number; volumePct: number }>;
  pointOfControl: number;
  currentPrice: number;
}) {
  const maxVol = Math.max(...profile.map(p => p.volumePct));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Volume Distribution</p>
        <InfoTooltip
          title="Volume Profile"
          what="Shows which price levels had the most trading activity historically."
          why="Areas of high volume act as support or resistance because many traders transacted there."
          how="Price range is divided into 10 buckets. Each bar shows what % of total volume occurred at that price."
          limitation="Uses closing prices only. Real intraday volume profiles use every tick, which is more accurate."
          currentContext={`Point of Control: ₹${pointOfControl.toFixed(1)}`}
        />
      </div>
      <div className="space-y-0.5">
        {[...profile].reverse().map((item, idx) => {
          const isPOC = Math.abs(item.priceLevel - pointOfControl) / pointOfControl < 0.02;
          const isCurrentZone = currentPrice >= item.low && currentPrice <= item.high;
          const barWidth = maxVol > 0 ? (item.volumePct / maxVol) * 100 : 0;

          return (
            <div key={idx} className="flex items-center gap-2 group">
              <span className={`text-[10px] font-mono w-12 text-right flex-shrink-0 ${isCurrentZone ? 'text-white font-bold' : 'text-[#8B949E]'}`}>
                ₹{item.priceLevel.toFixed(0)}
              </span>
              <div className="flex-1 h-3 bg-[#0D1117] relative">
                <div
                  className={`h-full transition-all duration-500 ${isPOC ? 'bg-[#6366F1]' : isCurrentZone ? 'bg-emerald-500/60' : 'bg-[#8B949E]/25'}`}
                  style={{ width: `${barWidth}%` }}
                />
                {isCurrentZone && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <span className="text-[9px] text-emerald-400 font-bold">← NOW</span>
                  </div>
                )}
              </div>
              <span className={`text-[9px] font-mono w-7 flex-shrink-0 ${isPOC ? 'text-[#6366F1] font-bold' : 'text-[#8B949E]'}`}>
                {item.volumePct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] font-medium text-[#8B949E]">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#6366F1] inline-block" />Point of Control</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500/60 inline-block" />Current Price Zone</span>
      </div>
    </div>
  );
}

export default function VolumeBehaviourEngine({ volumeBehaviour, quantModels, classicIndicators, currentPrice }: VolumeBehaviourProps) {
  const { context, participationTrend } = volumeBehaviour;
  const vwapDist = classicIndicators.vwapDistancePct ?? context.vwapDistancePct ?? 0;
  const obvSlope = classicIndicators.obvSlope ?? (context.obvSlope > 0 ? 'rising' : 'falling');

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-5 hover:border-[#30363D] transition-all duration-200">
      <SectionHeader
        label="Section 3 — Volume Behaviour"
        question="Is volume supporting what price is doing?"
        accent="emerald"
        tooltipTitle="Volume Behaviour Engine"
        tooltipWhat="Analyses whether buying/selling activity (volume) is confirming or contradicting the price movement."
        tooltipWhy="Price moves without volume confirmation are often weak or unsustainable. High-volume moves are more credible."
        tooltipHow="Combines OBV slope, Volume vs 20-day average, VWAP position, and Volume Profile."
        tooltipLimitation="Volume data from NSE may have gaps. Results are most reliable on liquid large-cap stocks."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pressure Gauge + Context */}
        <div className="space-y-4">
          <VolumePressureGauge value={volumeBehaviour.pressure} />

          {/* Context facts */}
          <div className="space-y-2">
            {[
              {
                label: 'Volume vs 20d Avg',
                value: `${context.volumeRatio.toFixed(2)}x`,
                state: context.volumeRatio > 1.3 ? 'Above average — elevated activity' : context.volumeRatio < 0.7 ? 'Below average — quiet session' : 'Near average',
                color: context.volumeRatio > 1.3 ? 'text-emerald-400' : context.volumeRatio < 0.7 ? 'text-[#F59E0B]' : 'text-[#8B949E]'
              },
              {
                label: 'OBV Direction',
                value: obvSlope === 'rising' ? '↑ Rising' : '↓ Falling',
                state: obvSlope === 'rising' ? 'Volume favouring upward movement' : 'Volume favouring downward movement',
                color: obvSlope === 'rising' ? 'text-emerald-400' : 'text-rose-400'
              },
              {
                label: 'VWAP Distance',
                value: `${vwapDist >= 0 ? '+' : ''}${vwapDist.toFixed(2)}%`,
                state: Math.abs(vwapDist) < 0.5 ? 'Price near volume-weighted average' : vwapDist > 0 ? 'Price above volume-weighted average' : 'Price below volume-weighted average',
                color: Math.abs(vwapDist) < 0.5 ? 'text-[#8B949E]' : vwapDist > 0 ? 'text-emerald-400' : 'text-rose-400'
              }
            ].map((item) => (
              <div key={item.label} className="bg-[#0D1117] border border-[#21262D] px-3 py-2">
                <p className="text-xs text-[#8B949E] uppercase tracking-wider font-bold">{item.label}</p>
                <p className={`text-sm font-mono font-bold mt-0.5 ${item.color}`}>{item.value}</p>
                <p className="text-xs text-[#8B949E] mt-0.5">{item.state}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Middle: Participation Trend */}
        <div className="space-y-3">
          <ParticipationSparkline data={participationTrend} />

          <div className="bg-[#0D1117] border border-[#21262D] p-3">
            <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Volume Context</p>
            <p className="text-xs text-white leading-relaxed">
              {context.volumeRatio > 1.3
                ? `Activity is running ${context.volumeRatio.toFixed(1)}× above the 20-day average. Elevated participation suggests institutional or news-driven interest.`
                : context.volumeRatio < 0.7
                  ? `Activity is running ${context.volumeRatio.toFixed(1)}× below the 20-day average. Quiet sessions often precede breakouts in either direction.`
                  : `Volume is near its 20-day average (${context.volumeRatio.toFixed(2)}×), suggesting normal market participation without unusual conviction.`}
            </p>
            {Math.abs(vwapDist) > 1.5 && (
              <p className="text-xs text-[#F59E0B] mt-2">
                ⚠ Price is {Math.abs(vwapDist).toFixed(1)}% {vwapDist > 0 ? 'above' : 'below'} the volume-weighted average — a larger-than-usual deviation from the daily equilibrium price.
              </p>
            )}
          </div>
        </div>

        {/* Right: Volume Profile */}
        <div>
          <VolumeProfileHistogram
            profile={quantModels.volumeProfile.profile}
            pointOfControl={quantModels.volumeProfile.pointOfControl}
            currentPrice={currentPrice}
          />
        </div>
      </div>

      <p className="text-[10px] text-[#8B949E]/70 mt-4 italic">
        Volume analysis describes historical participation patterns. It does not indicate future price direction.
      </p>
    </div>
  );
}
