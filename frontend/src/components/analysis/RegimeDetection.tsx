import React from 'react';

interface RegimeDetectionProps {
  regimeDetection: {
    currentRegime: string;
    daysSpent: number;
    historicalFrequency: number;
  };
}

export default function RegimeDetection({ regimeDetection }: RegimeDetectionProps) {
  const { currentRegime, daysSpent, historicalFrequency } = regimeDetection;

  let description = 'Market is transitioning between primary states or experiencing minor intermediate consolidations.';
  let regimeColor = 'text-[#8B949E]';
  let borderAccent = 'border-l-[#8B949E]';
  let interpretation = 'Prioritize short-term range filters and observe breakout indicators.';

  if (currentRegime === 'Persistent Trend') {
    description = 'Strong directional momentum. High ADX and Kaufman Efficiency indicating efficient trend propagation.';
    regimeColor = 'text-[#6366F1]';
    borderAccent = 'border-l-[#6366F1]';
    interpretation = 'Focus on trend-following strategies (MAs, MACD) and avoid counter-trend trades.';
  } else if (currentRegime === 'Range Bound') {
    description = 'Sideways price action with low directional strength. Mean reversion signals are dominant.';
    regimeColor = 'text-[#F59E0B]';
    borderAccent = 'border-l-[#F59E0B]';
    interpretation = 'Focus on mean-reversion strategies (Oscillators, Bollinger Bands) and avoid breakout triggers.';
  } else if (currentRegime === 'Volatility Expansion') {
    description = 'Expanding price ranges and rising realized volatility. High risk of abrupt breakout or reversal.';
    regimeColor = 'text-rose-500';
    borderAccent = 'border-l-rose-500';
    interpretation = 'Prioritize risk management and tail-risk protection. Tighten stop-losses.';
  } else if (currentRegime === 'Volatility Compression') {
    description = 'Tightening price consolidation and historically low volatility, indicating energy building for a breakout.';
    regimeColor = 'text-emerald-500';
    borderAccent = 'border-l-emerald-500';
    interpretation = 'Observe breakout directions. Consolidating energy often leads to expansion.';
  }

  return (
    <div className={`bg-[#161B22] border border-[#21262D] border-l-4 ${borderAccent} p-6 select-none font-sans flex flex-col justify-between min-h-[460px] text-left hover:border-slate-500 transition-all duration-200`}>
      <div className="w-full border-b border-[#21262D] pb-3 mb-4 flex justify-between items-center select-none">
        <span className="text-xs text-[#8B949E] uppercase tracking-widest font-bold">
          Regime Detection Engine
        </span>
        <span className="text-[10px] text-[#8B949E] font-mono border border-[#21262D] px-2 py-0.5">
          CURRENT STRUCTURE
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-5 justify-center">
        <div>
          <span className="text-[10px] text-[#8B949E] uppercase tracking-widest font-bold block mb-1">
            Active Market Regime
          </span>
          <div className={`font-mono text-2xl font-bold uppercase tracking-wide leading-none ${regimeColor}`}>
            {currentRegime}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 select-none">
          <div className="bg-[#0D1117] border border-[#21262D] p-3 flex flex-col justify-between">
            <span className="text-[9px] text-[#8B949E] uppercase tracking-widest font-bold">CONSECUTIVE DAYS</span>
            <div className="font-mono text-lg font-bold text-white mt-1 leading-none">
              {daysSpent} DAYS
            </div>
          </div>
          <div className="bg-[#0D1117] border border-[#21262D] p-3 flex flex-col justify-between">
            <span className="text-[9px] text-[#8B949E] uppercase tracking-widest font-bold">HISTORICAL FREQ</span>
            <div className="font-mono text-lg font-bold text-white mt-1 leading-none">
              {historicalFrequency.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Visible investor education block */}
        <div className="bg-[#0D1117]/60 border border-[#21262D]/60 p-4 space-y-2.5 rounded-sm select-none">
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">WHY IT IS USED</span>
            <p className="text-xs text-white leading-relaxed mt-0.5">
              Classifies daily market structures to guide students on whether trend-following or mean-reverting tools are historically appropriate.
            </p>
          </div>
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">HOW TO CONSIDER</span>
            <p className="text-xs text-[#8B949E] leading-relaxed mt-0.5">
              {interpretation} {description}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#21262D] pt-3 mt-4 select-none flex justify-between text-[9px] text-[#8B949E] uppercase font-mono font-bold tracking-wider">
        <span>MODEL: STATISTICAL CLASSIFIER</span>
        <span>SEBI EDUCATIONAL GUIDE</span>
      </div>
    </div>
  );
}
