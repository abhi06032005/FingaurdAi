import React from 'react';

interface DeltaItem {
  name: string;
  val: number;
  formatted: string;
}

interface WhatChangedProps {
  dailyDelta: {
    biggestIncrease: DeltaItem | null;
    biggestDecrease: DeltaItem | null;
    deltas: {
      rsi: number;
      macd: number;
      adx: number;
      volatility: number;
      volumeRatio: number;
      confluence: number;
      drawdown: number;
    };
  };
}

export default function WhatChanged({ dailyDelta }: WhatChangedProps) {
  const { biggestIncrease, biggestDecrease, deltas } = dailyDelta;

  const formatValue = (key: string, val: number) => {
    const prefix = val >= 0 ? '+' : '';
    const color = val >= 0 ? 'text-[#6366F1]' : 'text-[#F59E0B]'; // Neutral colors (indigo, amber)
    
    let formattedStr = '';
    if (key === 'rsi' || key === 'adx' || key === 'confluence') {
      formattedStr = `${prefix}${val.toFixed(2)}`;
    } else if (key === 'macd') {
      formattedStr = `${prefix}${val.toFixed(4)}`;
    } else if (key === 'volatility' || key === 'drawdown') {
      formattedStr = `${prefix}${val.toFixed(2)}%`;
    } else if (key === 'volumeRatio') {
      formattedStr = `${prefix}${val.toFixed(2)}x`;
    } else {
      formattedStr = `${prefix}${val.toFixed(2)}`;
    }

    return <span className={`font-mono font-bold ${color}`}>{formattedStr}</span>;
  };

  const getIndicatorName = (key: string) => {
    switch (key) {
      case 'rsi': return 'RSI (14)';
      case 'macd': return 'MACD Histogram';
      case 'adx': return 'Trend Strength (ADX)';
      case 'volatility': return 'Realized Volatility';
      case 'volumeRatio': return 'Volume Ratio';
      case 'confluence': return 'Confluence Score';
      case 'drawdown': return 'Drawdown Depth';
      default: return key.toUpperCase();
    }
  };

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-6 select-none font-sans flex flex-col justify-between min-h-[460px] text-left hover:border-slate-500 transition-all duration-200">
      <div className="w-full border-b border-[#21262D] pb-3 mb-4 flex justify-between items-center select-none">
        <span className="text-xs text-[#8B949E] uppercase tracking-widest font-bold">
          Daily Delta tracking
        </span>
        <span className="text-[10px] text-[#8B949E] font-mono border border-[#21262D] px-2 py-0.5">
          24H VELOCITY
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-4 justify-center">
        {/* Highlight Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0D1117] border border-[#21262D] border-t-2 border-t-[#6366F1] p-3 flex flex-col justify-between">
            <span className="text-[9px] text-[#8B949E] uppercase tracking-widest font-bold">
              Biggest Acceleration
            </span>
            {biggestIncrease ? (
              <div className="mt-2">
                <span className="font-mono text-xs text-white font-bold block truncate">
                  {biggestIncrease.name}
                </span>
                <span className="font-mono text-base font-bold text-[#6366F1] block mt-1">
                  {biggestIncrease.val >= 0 ? '+' : ''}{biggestIncrease.formatted}
                </span>
              </div>
            ) : (
              <span className="text-xs text-[#8B949E] mt-2">No data</span>
            )}
          </div>

          <div className="bg-[#0D1117] border border-[#21262D] border-t-2 border-t-[#F59E0B] p-3 flex flex-col justify-between">
            <span className="text-[9px] text-[#8B949E] uppercase tracking-widest font-bold">
              Biggest Deceleration
            </span>
            {biggestDecrease ? (
              <div className="mt-2">
                <span className="font-mono text-xs text-white font-bold block truncate">
                  {biggestDecrease.name}
                </span>
                <span className="font-mono text-base font-bold text-[#F59E0B] block mt-1">
                  {biggestDecrease.val >= 0 ? '+' : ''}{biggestDecrease.formatted}
                </span>
              </div>
            ) : (
              <span className="text-xs text-[#8B949E] mt-2">No data</span>
            )}
          </div>
        </div>

        {/* Delta List */}
        <div className="flex-1 flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
          {Object.entries(deltas).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center py-1 border-b border-[#21262D]/40 text-xs select-none">
              <span className="text-[#8B949E] font-medium">{getIndicatorName(key)}</span>
              {formatValue(key, val)}
            </div>
          ))}
        </div>

        {/* Visible investor education block */}
        <div className="bg-[#0D1117]/60 border border-[#21262D]/60 p-4 space-y-2.5 rounded-sm select-none">
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">WHY IT IS USED</span>
            <p className="text-xs text-white leading-relaxed mt-0.5">
              Tracks the absolute 24-hour velocity shifts in technical metrics. Helps spot sudden momentum breaks or volatility spikes.
            </p>
          </div>
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">HOW TO CONSIDER</span>
            <p className="text-xs text-[#8B949E] leading-relaxed mt-0.5">
              Identify indicators undergoing the largest rates of change. A sudden swing in Confluence indicates shifting support.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#21262D] pt-3 mt-4 select-none flex justify-between text-[9px] text-[#8B949E] uppercase font-mono font-bold tracking-wider">
        <span>MODEL: DEVIATION TRACKER</span>
        <span>SEBI EDUCATIONAL GUIDE</span>
      </div>
    </div>
  );
}
