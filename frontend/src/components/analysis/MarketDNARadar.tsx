"use client";

import React from 'react';
import SectionHeader from './shared/SectionHeader';
import InfoTooltip from './shared/InfoTooltip';

interface MarketDNA {
  trendPersistence: number;
  momentum: number;
  volatility: number;
  liquidity: number;
  participation: number;
  drawdownStability: number;
  relativeStrength: number;
}

interface MarketDNARadarProps {
  marketDNA: MarketDNA;
  ticker: string;
}

const DIMENSIONS = [
  {
    key: 'trendPersistence' as keyof MarketDNA,
    label: 'Trend Persistence',
    shortLabel: 'Trend',
    info: { what: 'How strongly price tends to continue in its current direction.', why: 'Determines whether trend-following tools are appropriate.', how: 'Derived from ADX × 2.5, capped at 100.' }
  },
  {
    key: 'momentum' as keyof MarketDNA,
    label: 'Momentum',
    shortLabel: 'Momentum',
    info: { what: 'The speed and strength of recent price movement.', why: 'Strong momentum often sustains before weakening.', how: 'Derived directly from RSI (0–100).' }
  },
  {
    key: 'volatility' as keyof MarketDNA,
    label: 'Volatility (inverted)',
    shortLabel: 'Stability',
    info: { what: 'How stable price movement has been recently.', why: 'Higher score means lower volatility — more predictable movement.', how: 'Inverted: 100 − (Realized Volatility × 2.5). Lower RV = higher score.' }
  },
  {
    key: 'liquidity' as keyof MarketDNA,
    label: 'Liquidity',
    shortLabel: 'Liquidity',
    info: { what: "This stock's volume rank compared to all NIFTY 50 peers.", why: 'More liquid stocks are easier to trade and have tighter spreads.', how: 'Percentile rank of today\'s volume vs all NIFTY 50 stocks today.' }
  },
  {
    key: 'participation' as keyof MarketDNA,
    label: 'Participation',
    shortLabel: 'Participation',
    info: { what: 'How much above or below average today\'s volume is.', why: 'High participation confirms price moves. Low participation signals weak moves.', how: 'Volume Ratio × 40, capped at 100.' }
  },
  {
    key: 'drawdownStability' as keyof MarketDNA,
    label: 'Drawdown Stability',
    shortLabel: 'Stability',
    info: { what: 'How close price is to its recent peak (inverse of drawdown).', why: 'Stocks near their peaks are in healthy equity curves.', how: '100 − Max Drawdown (%). Higher = less pullback from peak.' }
  },
  {
    key: 'relativeStrength' as keyof MarketDNA,
    label: 'Relative Strength',
    shortLabel: 'Rel. Strength',
    info: { what: 'How this stock has performed compared to NIFTY 50 peers.', why: 'Stocks outperforming their peers are showing relative leadership.', how: 'Average percentile rank across 5d, 20d, 60d, 120d return windows.' }
  }
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function buildPolygonPoints(values: number[], cx: number, cy: number, maxR: number): string {
  const n = values.length;
  return values
    .map((v, i) => {
      const angle = (360 / n) * i;
      const r = (v / 100) * maxR;
      const pt = polarToCartesian(cx, cy, r, angle);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');
}

export default function MarketDNARadar({ marketDNA, ticker }: MarketDNARadarProps) {
  const cleanTicker = ticker.replace('.NS', '');
  const cx = 160;
  const cy = 160;
  const maxR = 120;
  const n = DIMENSIONS.length;

  const values = DIMENSIONS.map(d => Math.max(0, Math.min(100, marketDNA[d.key])));
  const polygonPoints = buildPolygonPoints(values, cx, cy, maxR);

  // Grid rings
  const rings = [20, 40, 60, 80, 100];

  // Axis endpoints
  const axes = DIMENSIONS.map((_, i) => {
    const angle = (360 / n) * i;
    return {
      start: polarToCartesian(cx, cy, 0, angle),
      end: polarToCartesian(cx, cy, maxR, angle),
      labelPt: polarToCartesian(cx, cy, maxR + 22, angle)
    };
  });

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-5 hover:border-[#30363D] transition-all duration-200">
      <SectionHeader
        label="Section 7 — Market DNA"
        question={`What is ${cleanTicker}'s analytical fingerprint?`}
        accent="indigo"
        tooltipTitle="Market DNA Radar"
        tooltipWhat="A 7-dimensional fingerprint of the stock's current analytical characteristics."
        tooltipWhy="Provides a visual summary of the stock's overall profile across trend, momentum, volatility, liquidity, participation, stability, and relative strength."
        tooltipHow="Each axis is scored 0–100. Larger area = stronger profile overall. Individual axis scores are independently computed."
        tooltipLimitation="Radar area is not a single score — do not sum the dimensions. Each axis must be read independently."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* SVG Radar */}
        <div className="flex justify-center">
          <svg width="320" height="320" viewBox="0 0 320 320">
            {/* Grid rings */}
            {rings.map((ring) => {
              const ringPoints = buildPolygonPoints(Array(n).fill(ring), cx, cy, maxR);
              return (
                <polygon
                  key={ring}
                  points={ringPoints}
                  fill="none"
                  stroke="#21262D"
                  strokeWidth="0.5"
                />
              );
            })}

            {/* Axis lines */}
            {axes.map((axis, i) => (
              <line
                key={i}
                x1={axis.start.x} y1={axis.start.y}
                x2={axis.end.x} y2={axis.end.y}
                stroke="#21262D"
                strokeWidth="0.5"
              />
            ))}

            {/* Data polygon */}
            <polygon
              points={polygonPoints}
              fill="#6366F1"
              fillOpacity="0.18"
              stroke="#6366F1"
              strokeWidth="1.5"
            />

            {/* Data points */}
            {values.map((v, i) => {
              const angle = (360 / n) * i;
              const r = (v / 100) * maxR;
              const pt = polarToCartesian(cx, cy, r, angle);
              return (
                <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#6366F1" stroke="#161B22" strokeWidth="1.5" />
              );
            })}

            {/* Axis labels */}
            {axes.map((axis, i) => {
              const dim = DIMENSIONS[i];
              const angle = (360 / n) * i;
              const xAlign = Math.abs(Math.cos((angle - 90) * Math.PI / 180)) < 0.1 ? 'middle' : Math.cos((angle - 90) * Math.PI / 180) > 0 ? 'start' : 'end';

              return (
                <g key={i}>
                  <text
                    x={axis.labelPt.x}
                    y={axis.labelPt.y}
                    textAnchor={xAlign}
                    fill="#8B949E"
                    fontSize="10"
                    fontFamily="Inter, system-ui, sans-serif"
                    fontWeight="600"
                    dominantBaseline="middle"
                  >
                    {dim.shortLabel}
                  </text>
                  <text
                    x={axis.labelPt.x}
                    y={axis.labelPt.y + 11}
                    textAnchor={xAlign}
                    fill="#6366F1"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="700"
                    dominantBaseline="middle"
                  >
                    {values[i].toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Center dot */}
            <circle cx={cx} cy={cy} r="3" fill="#6366F1" opacity="0.5" />
          </svg>
        </div>

        {/* Dimension breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-3">Dimension Scores</p>
          {DIMENSIONS.map((dim, i) => {
            const val = values[i];
            let color = '#8B949E';
            if (val >= 70) color = '#10B981';
            else if (val >= 50) color = '#6366F1';
            else if (val < 30) color = '#EF4444';

            return (
              <div key={dim.key} className="group">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{dim.label}</span>
                    <InfoTooltip
                      title={dim.label}
                      what={dim.info.what}
                      why={dim.info.why}
                      how={dim.info.how}
                      currentContext={`Score: ${val.toFixed(0)} / 100`}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color }}>{val.toFixed(0)}</span>
                </div>
                <div className="w-full h-1 bg-[#21262D] overflow-hidden">
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{ width: `${val}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
