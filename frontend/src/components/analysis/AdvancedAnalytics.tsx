"use client";

import React from 'react';

interface AdvancedAnalyticsProps {
  quantModels: {
    hurstExponent: number;
    efficiencyRatio: number;
    realizedVolatility: number;
    autocorrelation: { lag1: number; lag2: number; lag3: number; lag5: number; lag10: number };
    drawdown: { maxDrawdown: number; currentDrawdown: number; durationDays: number; underwaterCurve: number[] };
    returnStats: { annualizedReturn: number; annualizedVolatility: number; sharpeRatio: number; sortinoRatio: number; skewness: number; kurtosis: number };
    volumeProfile: { profile: { priceLevel: number; low: number; high: number; volumePct: number }[]; pointOfControl: number };
    ichimoku: { position: string };
  };
}

export default function AdvancedAnalytics({ quantModels }: AdvancedAnalyticsProps) {
  const {
    hurstExponent,
    efficiencyRatio,
    drawdown,
    returnStats,
    autocorrelation,
    volumeProfile
  } = quantModels;

  // Hurst Needle Angle: Hurst ranges from 0 to 1, maps to -90 to 90 degrees.
  const hurstAngle = hurstExponent * 180 - 90;

  // Autocorrelation lags helper
  const lags = [
    { name: 'Lag 1', val: autocorrelation.lag1 },
    { name: 'Lag 2', val: autocorrelation.lag2 },
    { name: 'Lag 3', val: autocorrelation.lag3 },
    { name: 'Lag 5', val: autocorrelation.lag5 },
    { name: 'Lag 10', val: autocorrelation.lag10 }
  ];

  // Drawdown SVG Path Calculation
  const drawDrawdownCurve = () => {
    const curve = drawdown.underwaterCurve;
    if (!curve || curve.length === 0) return null;
    const maxVal = Math.max(...curve, 1); // prevent division by zero
    const points = curve.map((val, idx) => {
      const x = (idx / (curve.length - 1)) * 300;
      const y = (val / maxVal) * 85 + 5; // offset top slightly
      return `${x},${y}`;
    });

    const linePath = `M ${points.join(' L ')}`;
    const areaPath = `${linePath} L 300,100 L 0,100 Z`;

    return { linePath, areaPath };
  };

  const ddPaths = drawDrawdownCurve();

  // Helper to render card header
  const renderCardHeader = (title: string, badgeValue?: string, badgeColor = 'text-white') => (
    <div className="flex items-center justify-between border-b border-[#21262D] pb-3 mb-4 select-none">
      <span className="text-xs text-[#8B949E] uppercase tracking-widest font-bold">
        {title}
      </span>
      {badgeValue && (
        <span className={`font-mono text-xs font-bold bg-[#0D1117] border border-[#21262D] px-2 py-0.5 rounded-sm ${badgeColor}`}>
          {badgeValue}
        </span>
      )}
    </div>
  );

  // Helper to render the education footer block directly visible inside each card
  const renderCardEducation = (why: string, how: string) => (
    <div className="bg-[#0D1117] border border-[#21262D] p-3 space-y-1.5 rounded-sm mt-4 text-left select-none">
      <div>
        <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">WHY IT IS USED</span>
        <p className="text-xs text-white leading-relaxed mt-0.5">{why}</p>
      </div>
      <div>
        <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">HOW TO CONSIDER</span>
        <p className="text-xs text-[#8B949E] leading-relaxed mt-0.5">{how}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 select-none font-sans">
      <div className="border-l-2 border-[#6366F1] pl-2 py-0.5 select-none">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest">
          Quantitative Intelligence Console
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Hurst Exponent Card */}
        <div className="bg-[#161B22] border border-[#21262D] p-5 flex flex-col justify-between select-none min-h-[380px] hover:border-slate-500 transition-all duration-200">
          <div>
            {renderCardHeader('Hurst Exponent', `H = ${hurstExponent.toFixed(3)}`)}

            <div className="flex flex-col items-center justify-center my-3 relative">
              {/* Semicircular Gauge SVG */}
              <svg width="150" height="70" viewBox="0 0 100 55" className="overflow-visible select-none">
                <path d="M 10 50 A 40 40 0 0 1 42 16" fill="none" stroke="#F59E0B" strokeWidth="6" opacity="0.35" />
                <path d="M 42 16 A 40 40 0 0 1 58 16" fill="none" stroke="#8B949E" strokeWidth="6" opacity="0.5" />
                <path d="M 58 16 A 40 40 0 0 1 90 50" fill="none" stroke="#6366F1" strokeWidth="6" opacity="0.35" />

                {/* Needle Pivot */}
                <circle cx="50" cy="50" r="4.5" fill="white" />
                {/* Needle line */}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="14"
                  stroke="white"
                  strokeWidth="2"
                  transform={`rotate(${hurstAngle} 50 50)`}
                  className="transition-transform duration-700 ease-out"
                />
              </svg>

              {/* Gauge Labels */}
              <div className="flex justify-between w-full text-[8px] font-mono text-[#8B949E] px-2 mt-2 select-none uppercase">
                <span className="text-[#F59E0B] font-bold">Mean-Reverting</span>
                <span className="text-white">Random Walk</span>
                <span className="text-[#6366F1] font-bold">Trending</span>
              </div>
            </div>
          </div>

          {renderCardEducation(
            'Measures long-term memory of price series to check if market has directional momentum or a tendency to revert.',
            `H > 0.55 indicates trending memory (use MAs/MACD). H < 0.45 indicates mean reversion (use oscillators/BB). H ~ 0.5 suggests a random walk.`
          )}
        </div>

        {/* 2. Kaufman Efficiency Ratio Card */}
        <div className="bg-[#161B22] border border-[#21262D] p-5 flex flex-col justify-between select-none min-h-[380px] hover:border-slate-500 transition-all duration-200">
          <div>
            {renderCardHeader('Efficiency Ratio', `ER = ${efficiencyRatio.toFixed(3)}`)}

            <div className="my-5 space-y-2 select-none">
              {/* Horizontal Track Bar */}
              <div className="relative w-full h-2.5 bg-[#0D1117] border border-[#21262D]">
                <div className="absolute top-0 bottom-0 left-0 bg-[#6366F1]/25" style={{ width: `${efficiencyRatio * 100}%` }}></div>
                <div className="absolute top-0 bottom-0 w-1.5 bg-[#6366F1] border border-white/80" style={{ left: `calc(${efficiencyRatio * 100}% - 3px)` }}></div>
              </div>
              <div className="flex justify-between text-[8px] font-mono text-[#8B949E] uppercase tracking-wider select-none">
                <span className="text-[#F59E0B]">Noisy / Congested (0.0)</span>
                <span className="text-[#6366F1]">Clean Trend (1.0)</span>
              </div>
            </div>
          </div>

          {renderCardEducation(
            'Quantifies the ratio between absolute price movement and total noise. Measures price speed efficiency.',
            'ER > 0.40 suggests strong trend progression with minimal whipsaws. ER < 0.20 indicates chaotic sideways congestion.'
          )}
        </div>

        {/* 3. Drawdown Analysis Card */}
        <div className="bg-[#161B22] border border-[#21262D] p-5 flex flex-col justify-between select-none min-h-[380px] hover:border-slate-500 transition-all duration-200">
          <div>
            {renderCardHeader('Drawdown Analysis', `MAX DD: -${drawdown.maxDrawdown.toFixed(2)}%`, 'text-[#F59E0B]')}

            <div className="my-2.5 relative">
              {ddPaths && (
                <svg width="100%" height="70" viewBox="0 0 300 100" preserveAspectRatio="none" className="overflow-visible select-none">
                  <path d={ddPaths.areaPath} fill="rgba(245, 158, 11, 0.08)" />
                  <path d={ddPaths.linePath} fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#21262D" strokeWidth="0.8" strokeDasharray="3" />
                  <line x1="0" y1="0" x2="300" y2="0" stroke="#21262D" strokeWidth="0.8" />
                </svg>
              )}
              <div className="flex justify-between text-[7px] font-mono text-[#8B949E] uppercase tracking-wider mt-1.5 select-none">
                <span>150D Ago</span>
                <span className="font-bold text-[#F59E0B]">Current DD: -{drawdown.currentDrawdown.toFixed(2)}%</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {renderCardEducation(
            'Traces percentage price decline relative to local peak price points to check equity curve health.',
            `Max drawdown is -${drawdown.maxDrawdown.toFixed(1)}%. Current decline is -${drawdown.currentDrawdown.toFixed(1)}% spanning ${drawdown.durationDays} trading days.`
          )}
        </div>

        {/* 4. Autocorrelation Card */}
        <div className="bg-[#161B22] border border-[#21262D] p-5 flex flex-col justify-between select-none min-h-[380px] hover:border-slate-500 transition-all duration-200">
          <div>
            {renderCardHeader('Autocorrelation', `Lag-1: ${autocorrelation.lag1.toFixed(2)}`)}

            <div className="my-1.5 flex items-end justify-between h-[70px] px-2 select-none border-b border-[#21262D] pb-1">
              {lags.map((l, idx) => {
                const heightPct = Math.min(100, Math.abs(l.val) * 100);
                const isPositive = l.val >= 0;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group/bar relative">
                    <div className="w-4 bg-[#21262D] h-[50px] relative flex items-center justify-center">
                      <div 
                        className={`w-full absolute ${isPositive ? 'bottom-1/2 bg-[#6366F1]' : 'top-1/2 bg-[#F59E0B]'}`}
                        style={{ height: `${heightPct / 2}%` }}
                      />
                      <div className="absolute w-full h-[0.5px] bg-[#8B949E]/30 top-1/2"></div>
                    </div>
                    <span className="text-[7.5px] font-mono text-[#8B949E] mt-1.5">{l.name}</span>
                    <span className="absolute -top-7 bg-[#1C2128] text-white border border-[#21262D] text-[8px] font-mono px-1.5 py-0.5 rounded shadow-xl hidden group-hover/bar:block z-20">
                      {l.val.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {renderCardEducation(
            'Measures historical dependencies of returns. Determines if daily price moves copy yesterday (momentum) or alternate.',
            'Positive lag correlation suggests return persistence (trends continue). Negative suggests mean reversion tendencies.'
          )}
        </div>

        {/* 5. Volume Profile Card */}
        <div className="bg-[#161B22] border border-[#21262D] p-5 flex flex-col justify-between select-none min-h-[380px] hover:border-slate-500 transition-all duration-200">
          <div>
            {renderCardHeader('Volume Profile', `POC: ₹${volumeProfile.pointOfControl.toFixed(1)}`, 'text-[#6366F1]')}

            <div className="my-1.5 space-y-0.5 select-none">
              {volumeProfile.profile.map((item, idx) => {
                const isPOC = Math.abs(item.priceLevel - volumeProfile.pointOfControl) < 0.01;
                return (
                  <div key={idx} className="flex items-center gap-2 text-[7.5px] font-mono">
                    <span className="w-10 text-[#8B949E] text-right truncate">₹{item.priceLevel.toFixed(0)}</span>
                    <div className="flex-1 h-1.5 bg-[#0D1117] border border-[#21262D] relative">
                      <div 
                        className={`h-full transition-all duration-300 ${isPOC ? 'bg-[#6366F1]' : 'bg-[#8B949E]/20'}`}
                        style={{ width: `${item.volumePct}%` }}
                      />
                    </div>
                    <span className={`w-6 text-right ${isPOC ? 'text-[#6366F1] font-bold' : 'text-[#8B949E]'}`}>{item.volumePct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {renderCardEducation(
            'Aggregates volume vertically at price levels rather than chronologically, exposing structural order areas.',
            `Point of Control (POC) represents price zone with maximum transacted liquidity. Acts as support/resistance anchor.`
          )}
        </div>

        {/* 6. Return Statistics Table Card */}
        <div className="bg-[#161B22] border border-[#21262D] p-5 flex flex-col justify-between select-none min-h-[380px] hover:border-slate-500 transition-all duration-200">
          <div>
            {renderCardHeader('Return Distribution')}

            <div className="my-1 select-none overflow-x-auto">
              <table className="w-full text-[8.5px] font-mono text-left border-collapse">
                <tbody>
                  <tr className="border-b border-[#21262D]/60">
                    <td className="py-1 text-[#8B949E] uppercase">Annual Return</td>
                    <td className="py-1 text-right font-bold text-white">{returnStats.annualizedReturn.toFixed(1)}%</td>
                  </tr>
                  <tr className="border-b border-[#21262D]/60">
                    <td className="py-1 text-[#8B949E] uppercase">Annual Volatility</td>
                    <td className="py-1 text-right font-bold text-white">{returnStats.annualizedVolatility.toFixed(1)}%</td>
                  </tr>
                  <tr className="border-b border-[#21262D]/60">
                    <td className="py-1 text-[#8B949E] uppercase">Sharpe Ratio (6.5% rf)</td>
                    <td className="py-1 text-right font-bold text-white">{returnStats.sharpeRatio.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-[#21262D]/60">
                    <td className="py-1 text-[#8B949E] uppercase">Sortino Ratio</td>
                    <td className="py-1 text-right font-bold text-white">{returnStats.sortinoRatio.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-[#21262D]/60">
                    <td className="py-1 text-[#8B949E] uppercase">Skewness / Kurtosis</td>
                    <td className="py-1 text-right font-bold text-white">
                      {returnStats.skewness.toFixed(2)} / {returnStats.kurtosis.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {renderCardEducation(
            'Aggregates risk metrics to gauge volatility efficiency, positive returns skewness, and tail risks.',
            'Sharpe & Sortino measure returns relative to variance. Skewness shows asymmetry, Kurtosis checks tail fatness.'
          )}
        </div>

      </div>
    </div>
  );
}
