"use client";

import React, { useState } from 'react';
import { Search, Loader2, X } from 'lucide-react';

interface DNAMetrics {
  trendPersistence: number;
  momentum: number;
  volatility: number;
  liquidity: number;
  participation: number;
  drawdownStability: number;
  relativeStrength: number;
}

interface MarketDNAProps {
  marketDNA: DNAMetrics;
  ticker: string;
  apiBaseUrl: string;
}

export default function MarketDNA({ marketDNA, ticker, apiBaseUrl }: MarketDNAProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [comparisonTicker, setComparisonTicker] = useState<string | null>(null);
  const [comparisonDNA, setComparisonDNA] = useState<DNAMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 7 Axis Configuration
  const axes = [
    { label: 'Trend Persistence', key: 'trendPersistence' as const },
    { label: 'Momentum', key: 'momentum' as const },
    { label: 'Vol Stability', key: 'volatility' as const },
    { label: 'Liquidity Rank', key: 'liquidity' as const },
    { label: 'Participation', key: 'participation' as const },
    { label: 'Drawdown Stability', key: 'drawdownStability' as const },
    { label: 'Relative Strength', key: 'relativeStrength' as const }
  ];

  const totalAxes = axes.length;
  const centerX = 120;
  const centerY = 120;
  const maxRadius = 65;

  // Calculate angles for each axis (pointing upwards for first axis)
  const getAngle = (i: number) => {
    return (2 * Math.PI / totalAxes) * i - Math.PI / 2;
  };

  // Convert polar coordinates to Cartesian
  const polarToCartesian = (x: number, y: number, r: number, theta: number) => {
    return {
      x: x + r * Math.cos(theta),
      y: y + r * Math.sin(theta)
    };
  };

  // Helper to generate the SVG polygon points for a DNA data structure
  const getPolygonPoints = (dna: DNAMetrics) => {
    return axes.map((axis, i) => {
      const value = dna[axis.key];
      const r = (value / 100) * maxRadius;
      const angle = getAngle(i);
      const pos = polarToCartesian(centerX, centerY, r, angle);
      return `${pos.x},${pos.y}`;
    }).join(' ');
  };

  // Grid Concentric Grid levels (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const getGridPoints = (level: number) => {
    return Array.from({ length: totalAxes }).map((_, i) => {
      const angle = getAngle(i);
      const r = level * maxRadius;
      const pos = polarToCartesian(centerX, centerY, r, angle);
      return `${pos.x},${pos.y}`;
    }).join(' ');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    let target = searchQuery.trim().toUpperCase();
    if (!target.endsWith('.NS')) {
      target = target + '.NS';
    }

    if (target === ticker.toUpperCase()) {
      setErrorMsg('Cannot compare asset with itself.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${apiBaseUrl}/api/analysis/${target}`);
      if (res.ok) {
        const json = await res.json();
        if (json.marketDNA) {
          setComparisonTicker(json.ticker);
          setComparisonDNA(json.marketDNA);
          setSearchQuery('');
        } else {
          setErrorMsg('Invalid response shape from comparison asset.');
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMsg(errJson.error || `Symbol ${target} not found.`);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearComparison = () => {
    setComparisonTicker(null);
    setComparisonDNA(null);
    setErrorMsg('');
  };

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-6 select-none font-sans flex flex-col justify-between min-h-[460px] text-left hover:border-slate-500 transition-all duration-200">
      <div className="w-full border-b border-[#21262D] pb-3 mb-4 flex justify-between items-center select-none">
        <span className="text-xs text-[#8B949E] uppercase tracking-widest font-bold">
          Market DNA Profile
        </span>
        <span className="text-[10px] text-[#8B949E] font-mono border border-[#21262D] px-2 py-0.5">
          SEVEN-AXIS COHERENCE
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-4 justify-center">
        <div className="flex flex-col sm:flex-row items-center gap-4 select-none justify-between">
          {/* SVG Radar Chart */}
          <div className="relative w-40 h-40 flex-shrink-0 mx-auto sm:mx-0">
            <svg viewBox="0 0 240 240" className="w-full h-full">
              {/* Concentric Grid lines */}
              {gridLevels.map((lvl) => (
                <polygon
                  key={lvl}
                  points={getGridPoints(lvl)}
                  fill="transparent"
                  stroke="#21262D"
                  strokeWidth="0.8"
                />
              ))}

              {/* Axis Rays */}
              {Array.from({ length: totalAxes }).map((_, i) => {
                const angle = getAngle(i);
                const pos = polarToCartesian(centerX, centerY, maxRadius, angle);
                return (
                  <line
                    key={i}
                    x1={centerX}
                    y1={centerY}
                    x2={pos.x}
                    y2={pos.y}
                    stroke="#21262D"
                    strokeWidth="0.8"
                  />
                );
              })}

              {/* Axis Labels */}
              {axes.map((axis, i) => {
                const angle = getAngle(i);
                const pos = polarToCartesian(centerX, centerY, maxRadius + 18, angle);
                
                // Adjust text anchors based on angle positions
                let textAnchor: "middle" | "start" | "end" = 'middle';
                if (Math.cos(angle) > 0.1) textAnchor = 'start';
                if (Math.cos(angle) < -0.1) textAnchor = 'end';

                let dy = '0.35em';
                if (Math.sin(angle) > 0.7) dy = '0.9em';
                if (Math.sin(angle) < -0.7) dy = '-0.3em';

                return (
                  <text
                    key={axis.label}
                    x={pos.x}
                    y={pos.y}
                    textAnchor={textAnchor}
                    dy={dy}
                    fill="#8B949E"
                    fontSize="8.5px"
                    fontWeight="bold"
                    className="uppercase tracking-wider select-none font-mono"
                  >
                    {axis.label}
                  </text>
                );
              })}

              {/* Primary Ticker Polygon */}
              <polygon
                points={getPolygonPoints(marketDNA)}
                fill="rgba(99, 102, 241, 0.15)"
                stroke="#6366F1"
                strokeWidth="1.8"
                className="transition-all duration-500 ease-out"
              />

              {/* Secondary Comparison Ticker Polygon */}
              {comparisonDNA && (
                <polygon
                  points={getPolygonPoints(comparisonDNA)}
                  fill="rgba(245, 158, 11, 0.15)"
                  stroke="#F59E0B"
                  strokeWidth="1.8"
                  className="transition-all duration-500 ease-out"
                />
              )}
            </svg>
          </div>

          {/* Controls & Legend */}
          <div className="flex-1 flex flex-col justify-between w-full select-none max-w-[170px] space-y-3">
            {/* Legend */}
            <div className="space-y-1.5 bg-[#0D1117]/85 p-3 border border-[#21262D]">
              <div className="flex items-center justify-between text-[10px] font-mono select-none">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-[#6366F1]" />
                  <span className="text-white font-bold">{ticker.replace('.NS', '')}</span>
                </div>
                <span className="text-[#8B949E]">(Base)</span>
              </div>

              {comparisonTicker ? (
                <div className="flex items-center justify-between text-[10px] font-mono select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-[#F59E0B]" />
                    <span className="text-[#F59E0B] font-bold">{comparisonTicker.replace('.NS', '')}</span>
                  </div>
                  <button
                    onClick={handleClearComparison}
                    className="text-[#8B949E] hover:text-white transition-colors cursor-pointer"
                    title="Clear comparison"
                  >
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <span className="text-[8.5px] italic text-[#8B949E]/75 block select-none">
                  Compare with another asset.
                </span>
              )}
            </div>

            {/* Comparison Input form */}
            <form onSubmit={handleSearch} className="relative select-none">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Compare stock..."
                disabled={loading}
                className="w-full bg-[#0D1117] border border-[#21262D] text-xs text-white px-2.5 py-2 pr-9 focus:outline-none focus:border-[#6366F1] font-mono uppercase rounded-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-1.5 top-1.5 p-1 text-[#8B949E] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              >
                {loading ? <Loader2 size={13} className="animate-spin text-[#6366F1]" /> : <Search size={13} />}
              </button>
            </form>

            {errorMsg && (
              <span className="text-[9px] text-[#F59E0B] block select-none truncate">
                {errorMsg}
              </span>
            )}
          </div>
        </div>

        {/* Visible investor education block */}
        <div className="bg-[#0D1117]/60 border border-[#21262D]/60 p-4 space-y-2.5 rounded-sm select-none">
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">WHY IT IS USED</span>
            <p className="text-xs text-white leading-relaxed mt-0.5">
              Constructs a 7-dimensional structural signature representing trend, volume, volatility, and returns behavior.
            </p>
          </div>
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">HOW TO CONSIDER</span>
            <p className="text-xs text-[#8B949E] leading-relaxed mt-0.5">
              Allows comparison of two different assets to highlight differences in trend structures, risk signatures, and strength characteristics.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#21262D] pt-3 mt-4 select-none flex justify-between text-[9px] text-[#8B949E] uppercase font-mono font-bold tracking-wider">
        <span>RADAR: 7-AXIS NORMALIZED</span>
        <span>SEBI EDUCATIONAL GUIDE</span>
      </div>
    </div>
  );
}
