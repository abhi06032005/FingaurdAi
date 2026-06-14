'use client';

import React, { useState } from 'react';
import { ScoreHistoryItemType } from '../../types/analysis.types';

interface SparklineProps {
  history: ScoreHistoryItemType[];
}

export default function ScoreHistorySparkline({ history }: SparklineProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl h-[160px] flex items-center justify-center">
        <span className="text-xs text-slate-500">History unavailable</span>
      </div>
    );
  }

  // Dimensions of SVG
  const width = 320;
  const height = 80;
  const padding = 6;

  // Map coordinates
  const points = history.map((item, idx) => {
    const x = padding + (idx / (history.length - 1)) * (width - 2 * padding);
    const scoreVal = typeof item.score === 'string' ? parseFloat(item.score) : item.score;
    const y = height - padding - (scoreVal / 100) * (height - 2 * padding);
    return { x, y, score: scoreVal, date: item.date };
  });

  // Build SVG path
  const linePath = points.length > 0
    ? points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    : '';

  // Build filled area path
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`
    : '';

  // Handle mouse moves over the SVG container to detect closest point
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = (clientX / rect.width) * width;

    // Find closest point in points array
    let closestIdx = 0;
    let minDiff = Math.abs(points[0].x - relativeX);

    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].x - relativeX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    setHoveredIdx(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  // Get current color depending on the score value
  const getStrokeColor = (val: number) => {
    if (val <= 20) return '#ef4444';
    if (val <= 40) return '#f97316';
    if (val <= 60) return '#eab308';
    if (val <= 80) return '#84cc16';
    return '#22c55e';
  };

  const latestScore = points[points.length - 1]?.score ?? 50;
  const strokeColor = getStrokeColor(latestScore);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[170px] relative">
      <div className="flex items-center justify-between mb-2 select-none">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          30-Day Technical Strength Trend
        </span>
        {hoveredIdx !== null ? (
          <span 
            className="text-xs font-bold font-mono px-2 py-0.5 rounded border bg-slate-850"
            style={{ 
              color: getStrokeColor(points[hoveredIdx].score),
              borderColor: `${getStrokeColor(points[hoveredIdx].score)}20`
            }}
          >
            {points[hoveredIdx].date}: {Math.round(points[hoveredIdx].score)}
          </span>
        ) : (
          <span className="text-xs text-slate-500 font-mono">
            Hover to inspect
          </span>
        )}
      </div>

      <div className="relative flex-1 w-full flex items-center justify-center">
        <svg
          className="w-full h-full cursor-crosshair overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Path Line */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover highlight circle */}
          {hoveredIdx !== null && (
            <>
              {/* Vertical dotted guide */}
              <line
                x1={points[hoveredIdx].x}
                y1={0}
                x2={points[hoveredIdx].x}
                y2={height}
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Highlight circle */}
              <circle
                cx={points[hoveredIdx].x}
                cy={points[hoveredIdx].y}
                r="4.5"
                fill={getStrokeColor(points[hoveredIdx].score)}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* Base border indicator line */}
          <line x1={0} y1={height} x2={width} y2={height} stroke="#334155" strokeWidth="0.5" />
        </svg>
      </div>
    </div>
  );
}
