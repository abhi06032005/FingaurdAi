'use client';

import React, { useEffect, useState, useRef } from 'react';

interface GaugeProps {
  score: number;
  rating: string;
  confluence: number;
}

export default function TechnicalStrengthGauge({ score, rating, confluence }: GaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset animation on score change
    const targetScore = score;
    const duration = 1200; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out quadratic
      const easeProgress = progress * (2 - progress);
      setAnimatedScore(easeProgress * targetScore);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score]);

  // Determine stroke color based on current score
  const getStrokeColor = (val: number) => {
    if (val <= 20) return '#ef4444'; // red
    if (val <= 40) return '#f97316'; // orange
    if (val <= 60) return '#eab308'; // yellow
    if (val <= 80) return '#84cc16'; // lime
    return '#22c55e'; // green
  };

  const currentColor = getStrokeColor(score);

  // SVG dimensions for gauge
  // Semicircle arc: Radius = 80, Stroke Width = 12, circumference = PI * R = 251.3
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius;
  
  // Dash offset for gauge: 100% score is 0 dash offset, 0% score is full circumference dash offset
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // SVG dimensions for confluence sub-arc
  // Semicircle arc: Radius = 62, Stroke Width = 4, circumference = PI * 62 = 194.8
  const subRadius = 64;
  const subStrokeWidth = 4;
  const subCircumference = Math.PI * subRadius;
  const subStrokeDashoffset = subCircumference - (confluence / 100) * subCircumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl h-[280px]">
      <div className="relative w-64 h-36 flex items-end justify-center overflow-hidden">
        {/* SVG Viewport */}
        <svg className="absolute top-0 w-64 h-64 transform rotate-180" viewBox="0 0 200 200">
          {/* Base Background Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
          {/* Filled Indicator Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.5s ease' }}
          />

          {/* Confluence Base Sub-arc */}
          <circle
            cx="100"
            cy="100"
            r={subRadius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={subStrokeWidth}
            strokeDasharray={subCircumference}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
          {/* Confluence Filled Sub-arc */}
          <circle
            cx="100"
            cy="100"
            r={subRadius}
            fill="none"
            stroke="#38bdf8" // sky blue for confluence
            strokeWidth={subStrokeWidth}
            strokeDasharray={subCircumference}
            strokeDashoffset={subStrokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Text values in center */}
        <div className="flex flex-col items-center mb-1 z-10">
          <span className="text-5xl font-bold tracking-tight text-white select-none">
            {Math.round(animatedScore)}
          </span>
          <span 
            className="text-xs font-semibold uppercase tracking-wider mt-1.5"
            style={{ color: currentColor }}
          >
            {rating}
          </span>
        </div>
      </div>

      {/* Footer labels */}
      <div className="w-full flex items-center justify-between border-t border-slate-800/60 pt-4 mt-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            Strength Score
          </span>
          <span className="text-sm font-semibold text-slate-300">
            {score} / 100
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            Confluence level
          </span>
          <span className="text-sm font-semibold text-sky-400">
            {confluence}% Agreement
          </span>
        </div>
      </div>
    </div>
  );
}
