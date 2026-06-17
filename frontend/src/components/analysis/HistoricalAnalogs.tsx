import React from 'react';

interface AnalogBreakdown {
  rsi: number;
  macd: number;
  adx: number;
  atr: number;
  hurst: number;
  efficiency: number;
  volatility: number;
  drawdown: number;
  zScore: number;
  percentile: number;
  volumeRatio: number;
}

interface HistoricalAnalog {
  date: string;
  similarity: number;
  marketStructure: string;
  sub5dReturn: number;
  sub20dReturn: number;
  volatilityChange: number;
  breakdown: AnalogBreakdown;
}

interface HistoricalAnalogsProps {
  analogs: HistoricalAnalog[];
}

export default function HistoricalAnalogs({ analogs }: HistoricalAnalogsProps) {
  const formatPct = (val: number) => {
    const prefix = val >= 0 ? '+' : '';
    const color = val >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]';
    return <span className={`font-mono font-bold ${color}`}>{prefix}{val.toFixed(2)}%</span>;
  };

  const formatVol = (val: number) => {
    const color = val >= 0 ? 'text-[#EF4444]' : 'text-[#10B981]'; // expanding volatility is warning/red, contracting is green/favorable
    return <span className={`font-mono font-bold ${color}`}>{val >= 0 ? '+' : ''}{val.toFixed(2)}%</span>;
  };

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-6 select-none font-sans flex flex-col justify-between min-h-[460px] text-left hover:border-slate-500 transition-all duration-200">
      <div className="w-full border-b border-[#21262D] pb-3 mb-4 flex justify-between items-center select-none">
        <span className="text-xs text-[#8B949E] uppercase tracking-widest font-bold">
          Historical Context
        </span>
        <span className="text-[10px] text-[#8B949E] font-mono border border-[#21262D] px-2 py-0.5">
          ANALOG SEARCH
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-3 justify-center">
        {/* List of analogs */}
        <div className="space-y-1.5 select-none">
          {analogs.map((item, idx) => (
            <div key={idx} className="relative group/row flex items-center justify-between p-2 bg-[#0D1117] border border-[#21262D] hover:border-[#6366F1] transition-all duration-200">
              <div className="flex flex-col">
                <span className="font-mono text-xs text-white font-bold">{item.date}</span>
                <span className="text-[9px] text-[#8B949E] uppercase tracking-wider mt-0.5">{item.marketStructure}</span>
              </div>
              
              <div className="text-right">
                <span className="font-mono text-[10px] font-bold text-[#6366F1] bg-[#6366F1]/10 border border-[#6366F1]/20 px-2 py-0.5">
                  {item.similarity.toFixed(1)}% SIM
                </span>
              </div>

              {/* Bloomberg style absolute slide-out popover on hover */}
              <div className="absolute hidden group-hover/row:block bg-[#1C2128] border border-[#21262D] p-4 text-[10px] w-[310px] z-50 shadow-2xl text-left select-none text-[#8B949E] left-full top-0 ml-2">
                <div className="border-b border-[#21262D] pb-1.5 mb-3 flex items-center justify-between">
                  <span className="font-bold text-white uppercase tracking-wider">Historical Analog ({item.date})</span>
                  <span className="text-[8px] text-[#8B949E] font-mono">i &le; t - 20 days</span>
                </div>

                {/* Distributions */}
                <div className="grid grid-cols-2 gap-4 mb-4 select-none">
                  <div className="bg-[#0D1117] border border-[#21262D] p-2 flex flex-col justify-between">
                    <span className="text-[8px] text-[#8B949E] uppercase tracking-widest font-bold">5D SUB. RETURN</span>
                    <span className="mt-1">{formatPct(item.sub5dReturn)}</span>
                  </div>
                  <div className="bg-[#0D1117] border border-[#21262D] p-2 flex flex-col justify-between">
                    <span className="text-[8px] text-[#8B949E] uppercase tracking-widest font-bold">20D SUB. RETURN</span>
                    <span className="mt-1">{formatPct(item.sub20dReturn)}</span>
                  </div>
                </div>

                <div className="bg-[#0D1117] border border-[#21262D] p-2 flex flex-col justify-between mb-4 select-none">
                  <span className="text-[8px] text-[#8B949E] uppercase tracking-widest font-bold">VOLATILITY DELTA</span>
                  <span className="mt-1">{formatVol(item.volatilityChange)} RV CHANGE</span>
                </div>

                {/* State Similarity Breakdown */}
                <div className="border-t border-[#21262D] pt-3 select-none">
                  <span className="text-[8px] text-[#8B949E] uppercase tracking-widest font-bold block mb-2">Similarity Vector Breakdown</span>
                  <div className="space-y-1.5">
                    {[
                      { label: 'RSI', val: item.breakdown.rsi },
                      { label: 'MACD Hist', val: item.breakdown.macd },
                      { label: 'ADX Trend', val: item.breakdown.adx },
                      { label: 'Hurst Exponent', val: item.breakdown.hurst },
                      { label: 'Efficiency Ratio', val: item.breakdown.efficiency },
                      { label: 'Price Percentile', val: item.breakdown.percentile },
                      { label: 'Volatility Consistency', val: item.breakdown.volatility }
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-[8px] font-mono">
                        <span className="w-20 text-[#8B949E]">{f.label}</span>
                        <div className="flex-1 h-1.5 bg-[#0D1117] border border-[#21262D]">
                          <div className="h-full bg-[#6366F1]" style={{ width: `${f.val * 100}%` }}></div>
                        </div>
                        <span className="w-8 text-right text-white font-bold">{(f.val * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[8px] text-[#8B949E]/60 mt-3 leading-normal border-t border-[#21262D] pt-2 italic select-none">
                  Note: Historical periods are shown for mathematical context only. Past performance is not predictive of future returns.
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* Visible investor education block */}
        <div className="bg-[#0D1117]/60 border border-[#21262D]/60 p-4 space-y-2.5 rounded-sm select-none">
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">WHY IT IS USED</span>
            <p className="text-xs text-white leading-relaxed mt-0.5">
              Locates the top 5 historical trading days in NIFTY data that match the mathematical signature of the current session.
            </p>
          </div>
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">HOW TO CONSIDER</span>
            <p className="text-xs text-[#8B949E] leading-relaxed mt-0.5">
              Hover over a row to inspect subsequent return outcomes and verify how the asset behaved following these mathematical setups.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#21262D] pt-3 mt-4 select-none flex justify-between text-[9px] text-[#8B949E] uppercase font-mono font-bold tracking-wider">
        <span>MODEL: VECTOR COSINE MATCH</span>
        <span>SEBI EDUCATIONAL GUIDE</span>
      </div>
    </div>
  );
}
