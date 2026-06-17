import React from 'react';

interface ConfluenceRadarProps {
  confluenceScore: {
    trend: number;
    momentum: number;
    volatility: number;
    volume: number;
    composite: number;
  };
  pivots: {
    classic: { pivot: number; r1: number; s1: number } | null;
  } | null;
  close: number;
}

export default function ConfluenceRadar({ confluenceScore, pivots, close }: ConfluenceRadarProps) {
  // Calculate structure score client-side based on pivot proximity
  const getStructureScore = () => {
    if (!pivots || !pivots.classic) return 0;
    const { pivot, r1, s1 } = pivots.classic;
    const current = close;
    if (current >= pivot) {
      const range = r1 - pivot;
      if (range === 0) return 0;
      const pct = (current - pivot) / range; // 0 to 1
      return Math.max(-1, Math.min(1, -pct)); // Near resistance is negative/diverging
    } else {
      const range = pivot - s1;
      if (range === 0) return 0;
      const pct = (pivot - current) / range; // 0 to 1
      return Math.max(-1, Math.min(1, pct)); // Near support is positive/aligned
    }
  };

  const structure = getStructureScore();

  // Radar values mapping: Trend, Momentum, Volatility, Volume, Structure
  // Map [-1, 1] to [0, 80] radius
  const getPoint = (value: number, angleDeg: number) => {
    const radius = 80;
    // Map -1 to 0 radius, 0 to 40 radius, 1 to 80 radius
    const r = radius * (value + 1) / 2;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = 110 + r * Math.cos(angleRad);
    const y = 110 + r * Math.sin(angleRad);
    return { x, y };
  };

  // 5 Axes angles (in degrees, rotated -90 to start pointing straight up)
  const angles = [-90, -18, 54, 126, 198];
  
  const values = [
    confluenceScore.trend,
    confluenceScore.momentum,
    confluenceScore.volatility,
    confluenceScore.volume,
    structure
  ];

  const points = values.map((val, idx) => getPoint(val, angles[idx]));
  const polygonPointsStr = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // SVG grid layers: outer (1.0), middle (0.0), inner (-1.0)
  const getGridPoints = (rValue: number) => {
    return angles.map(a => {
      const r = 80 * (rValue + 1) / 2;
      const angleRad = (a * Math.PI) / 180;
      const x = 110 + r * Math.cos(angleRad);
      const y = 110 + r * Math.sin(angleRad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const gridOuter = getGridPoints(1.0);
  const gridMiddle = getGridPoints(0.0);
  const gridInner = getGridPoints(-0.5);

  // Labels offsets
  const labels: { text: string; x: number; y: number; anchor: 'middle' | 'start' | 'end' }[] = [
    { text: 'TREND', x: 110, y: 12, anchor: 'middle' },
    { text: 'MOMENTUM', x: 205, y: 104, anchor: 'start' },
    { text: 'VOLATILITY', x: 170, y: 208, anchor: 'start' },
    { text: 'VOLUME', x: 50, y: 208, anchor: 'end' },
    { text: 'STRUCTURE', x: 15, y: 104, anchor: 'end' }
  ];

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-5 flex flex-col items-center justify-between select-none font-sans text-center h-[420px]">
      <div className="w-full flex justify-between items-center select-none border-b border-[#21262D] pb-3 mb-2">
        <span className="text-[10px] text-[#8B949E] uppercase tracking-widest font-bold">
          Confluence Radar
        </span>
        <span className="text-[8px] text-[#8B949E] font-mono border border-[#21262D] px-1.5 py-0.5">
          5-AXIS MATRIX
        </span>
      </div>

      <div className="relative my-2">
        {/* SVG Spider Chart */}
        <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible select-none">
          {/* Grid lines */}
          <polygon points={gridOuter} fill="none" stroke="#21262D" strokeWidth="1" />
          <polygon points={gridMiddle} fill="none" stroke="#8B949E" strokeWidth="1" strokeDasharray="3" opacity="0.3" />
          <polygon points={gridInner} fill="none" stroke="#21262D" strokeWidth="1" strokeDasharray="3" opacity="0.2" />

          {/* Axis Spoke Lines */}
          {angles.map((a, idx) => {
            const end = getPoint(1.0, a);
            return (
              <line
                key={idx}
                x1="110"
                y1="110"
                x2={end.x}
                y2={end.y}
                stroke="#21262D"
                strokeWidth="1"
              />
            );
          })}

          {/* Filled Polygon data */}
          <polygon
            points={polygonPointsStr}
            fill="rgba(99, 102, 241, 0.2)"
            stroke="#6366F1"
            strokeWidth="2"
            className="transition-all duration-500 ease-in-out"
          />

          {/* Data points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="white"
              stroke="#6366F1"
              strokeWidth="1.5"
            />
          ))}

          {/* Text Labels */}
          {labels.map((l, idx) => (
            <text
              key={idx}
              x={l.x}
              y={l.y}
              fill="#8B949E"
              fontSize="8.5"
              fontFamily="Inter, sans-serif"
              fontWeight="bold"
              textAnchor={l.anchor}
              className="select-none"
            >
              {l.text}
            </text>
          ))}
        </svg>
      </div>

      {/* Composite score display */}
      <div className="w-full pt-3 border-t border-[#21262D] mt-2">
        <div className="font-mono text-3xl font-bold text-white tracking-tight leading-none">
          {((confluenceScore.composite + 1) * 50).toFixed(0)}/100
        </div>
        <div className="text-[10px] text-[#8B949E] uppercase tracking-widest font-bold mt-1">
          Indicator Alignment Strength
        </div>
        <p className="text-[8.5px] text-[#8B949E]/70 leading-normal mt-2 italic select-none">
          Measures how consistently indicators point in the same direction. Not a prediction of future price movement.
        </p>
      </div>
    </div>
  );
}
