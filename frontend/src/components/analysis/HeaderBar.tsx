import React from 'react';

interface HeaderBarProps {
  ticker: string;
  asOf: string;
  dataWindowDays: number;
  close: number;
  percentileRank: number;
}

export default function HeaderBar({
  ticker,
  asOf,
  dataWindowDays,
  close,
  percentileRank
}: HeaderBarProps) {
  // Color-coded percentile rank: 0–33 red, 34–66 amber, 67–100 indigo
  let percentileBadgeBg = 'bg-rose-500/10 text-rose-450 border border-rose-500/20';
  if (percentileRank >= 34 && percentileRank <= 66) {
    percentileBadgeBg = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
  } else if (percentileRank > 66) {
    percentileBadgeBg = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
  }

  // Get NIFTY 50 metadata company name mapping if possible, or extract it from ticker
  const cleanTicker = ticker.replace('.NS', '');
  
  return (
    <div className="bg-[#161B22] border-b border-[#21262D] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
      <div className="flex items-center gap-4">
        {/* Ticker Box */}
        <div className="border border-[#21262D] bg-[#0D1117] px-4 py-2 font-mono text-2xl font-bold tracking-tight text-white">
          {cleanTicker}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-xs uppercase tracking-widest text-[#8B949E] font-semibold">
              NIFTY 50 Asset Analysis
            </h1>
            <span className="bg-[#21262D] text-[#8B949E] text-[10px] font-mono px-2 py-0.5 border border-[#21262D]">
              {dataWindowDays} DAYS
            </span>
          </div>
          <p className="text-white font-sans text-sm font-medium mt-0.5">
            NSE listed security
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 md:gap-8">
        {/* Price Info */}
        <div className="flex flex-col">
          <span className="text-[10px] text-[#8B949E] font-bold uppercase tracking-widest">
            Last Price
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-semibold text-white">
              ₹{close.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Price Percentile Badge */}
        <div className="flex flex-col">
          <span className="text-[10px] text-[#8B949E] font-bold uppercase tracking-widest">
            150D Rank
          </span>
          <div className={`mt-1 text-xs font-mono font-bold px-3 py-1.5 ${percentileBadgeBg}`}>
            RANK {percentileRank.toFixed(0)}/100
          </div>
        </div>

        {/* Date Info */}
        <div className="flex flex-col">
          <span className="text-[10px] text-[#8B949E] font-bold uppercase tracking-widest">
            As Of
          </span>
          <span className="font-mono text-sm text-[#8B949E] mt-2 bg-[#0D1117] border border-[#21262D] px-2.5 py-1">
            {asOf}
          </span>
        </div>
      </div>
    </div>
  );
}
