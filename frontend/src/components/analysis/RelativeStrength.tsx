import React from 'react';

interface PerformanceData {
  5: number;
  20: number;
  60: number;
  120: number;
}

interface PercentilesData {
  rank5d: number;
  rank20d: number;
  rank60d: number;
  rank120d: number;
}

interface SectorComparison {
  sectorName: string;
  avg5d: number;
  avg20d: number;
  avg60d: number;
  avg120d: number;
}

interface RelativeStrengthProps {
  relativeStrength: {
    performance: PerformanceData;
    percentiles: PercentilesData;
    sectorComparison: SectorComparison;
  };
  ticker: string;
}

export default function RelativeStrength({ relativeStrength, ticker }: RelativeStrengthProps) {
  const { performance, percentiles, sectorComparison } = relativeStrength;

  const getCellBg = (pct: number) => {
    if (pct >= 70) return 'bg-[#6366F1]/10 border-[#6366F1]/30 text-[#6366F1]'; // Strong alignment
    if (pct <= 30) return 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'; // Compressing/lagging
    return 'bg-[#0D1117] border-[#21262D] text-[#8B949E]';
  };

  const formatPctVal = (val: number) => {
    const prefix = val >= 0 ? '+' : '';
    return `${prefix}${val.toFixed(1)}%`;
  };

  const getRankSuffix = (rank: number) => {
    const r = Math.round(rank);
    if (r === 11 || r === 12 || r === 13) return `${r}th`;
    const lastDigit = r % 10;
    if (lastDigit === 1) return `${r}st`;
    if (lastDigit === 2) return `${r}nd`;
    if (lastDigit === 3) return `${r}rd`;
    return `${r}th`;
  };

  const periods = [
    { label: '5D', key: 5 as const, rankKey: 'rank5d' as const, secKey: 'avg5d' as const },
    { label: '20D', key: 20 as const, rankKey: 'rank20d' as const, secKey: 'avg20d' as const },
    { label: '60D', key: 60 as const, rankKey: 'rank60d' as const, secKey: 'avg60d' as const },
    { label: '120D', key: 120 as const, rankKey: 'rank120d' as const, secKey: 'avg120d' as const }
  ];

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-6 select-none font-sans flex flex-col justify-between min-h-[460px] text-left hover:border-slate-500 transition-all duration-200">
      <div className="w-full border-b border-[#21262D] pb-3 mb-4 flex justify-between items-center select-none">
        <span className="text-xs text-[#8B949E] uppercase tracking-widest font-bold">
          Relative Strength Comparison
        </span>
        <span className="text-[10px] text-[#8B949E] font-mono border border-[#21262D] px-2 py-0.5">
          HEATMAP MATRIX
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-3 justify-center">
        {/* Heatmap Grid */}
        <div className="grid grid-cols-4 gap-2 my-1 select-none">
          {periods.map((p) => {
            const stockRet = performance[p.key];
            const rankVal = percentiles[p.rankKey];
            const sectorRet = sectorComparison[p.secKey];
            const cellStyle = getCellBg(rankVal);

            return (
              <div
                key={p.label}
                className={`border p-2.5 flex flex-col justify-between h-[125px] transition-all duration-300 ${cellStyle}`}
              >
                {/* Header Period */}
                <span className="text-[9px] uppercase tracking-wider font-bold border-b border-[#21262D]/60 pb-1 block text-[#8B949E]">
                  {p.label}
                </span>

                {/* Stock Return */}
                <div className="my-1 select-none">
                  <span className="text-[8px] uppercase tracking-widest text-[#8B949E] block">
                    {ticker.replace('.NS', '')}
                  </span>
                  <span className="font-mono text-xs font-bold text-white block mt-0.5">
                    {formatPctVal(stockRet)}
                  </span>
                </div>

                {/* Index Rank */}
                <div className="my-1 select-none">
                  <span className="text-[8px] uppercase tracking-widest text-[#8B949E] block">
                    NIFTY Rank
                  </span>
                  <span className="font-mono text-[10px] font-bold block mt-0.5">
                    {getRankSuffix(rankVal)}
                  </span>
                </div>

                {/* Sector Return */}
                <div className="mt-0.5 select-none">
                  <span className="text-[7.5px] uppercase tracking-widest text-[#8B949E] block truncate">
                    Sector Avg
                  </span>
                  <span className="font-mono text-[9px] font-semibold block mt-0.5 text-white/80">
                    {formatPctVal(sectorRet)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visible investor education block */}
        <div className="bg-[#0D1117]/60 border border-[#21262D]/60 p-4 space-y-2.5 rounded-sm select-none">
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">WHY IT IS USED</span>
            <p className="text-xs text-white leading-relaxed mt-0.5">
              Compares returns of {ticker.replace('.NS', '')} against NIFTY 50 and Sector peers over 5d, 20d, 60d, and 120d windows.
            </p>
          </div>
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">HOW TO CONSIDER</span>
            <p className="text-xs text-[#8B949E] leading-relaxed mt-0.5">
              A high NIFTY rank (e.g. 75th+) suggests structural outperformance. Purple/indigo indicates relative strength, amber shows relative weakness.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#21262D] pt-3 mt-4 select-none flex justify-between text-[9px] text-[#8B949E] uppercase font-mono font-bold tracking-wider">
        <span>SECTOR: {sectorComparison.sectorName}</span>
        <span>SEBI EDUCATIONAL GUIDE</span>
      </div>
    </div>
  );
}
