import React from 'react';

interface IndicatorAttributionProps {
  attribution: {
    trend: number;
    momentum: number;
    volatility: number;
    volume: number;
    structure: number;
  };
  composite: number;
}

export default function IndicatorAttribution({ attribution, composite }: IndicatorAttributionProps) {
  const items = [
    { name: 'Trend Component', val: attribution.trend },
    { name: 'Momentum Component', val: attribution.momentum },
    { name: 'Volatility Component', val: attribution.volatility },
    { name: 'Volume Component', val: attribution.volume },
    { name: 'Structure (Pivots)', val: attribution.structure }
  ];

  // Scale: contributions are between -0.2 and +0.2 (since max value of raw categories is [-1, 1], divided by 5).
  // Let's multiply by 2.5 to map 0.2 to 50% width.
  const getBarStyles = (val: number) => {
    const isPositive = val >= 0;
    const widthPct = Math.min(50, Math.abs(val) * 250); // scale factor to fit
    
    return {
      isPositive,
      width: `${widthPct}%`,
      style: isPositive ? { left: '50%' } : { right: '50%' }
    };
  };

  const formatVal = (val: number) => {
    const sign = val >= 0 ? '+' : '';
    const color = val >= 0 ? 'text-[#6366F1]' : 'text-[#F59E0B]';
    return <span className={`font-mono font-bold text-xs ${color}`}>{sign}{val.toFixed(2)}</span>;
  };

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-6 select-none font-sans flex flex-col justify-between min-h-[460px] text-left hover:border-slate-500 transition-all duration-200">
      <div className="w-full border-b border-[#21262D] pb-3 mb-4 flex justify-between items-center select-none">
        <span className="text-xs text-[#8B949E] uppercase tracking-widest font-bold">
          Indicator Attribution
        </span>
        <span className="text-[10px] text-[#8B949E] font-mono border border-[#21262D] px-2 py-0.5">
          WATERFALL MATRIX
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-3 justify-center">
        {/* Waterfall Center aligned bars */}
        <div className="flex-1 flex flex-col gap-2.5 justify-center my-1 select-none">
          {items.map((item, idx) => {
            const bar = getBarStyles(item.val);
            return (
              <div key={idx} className="space-y-0.5 select-none">
                <div className="flex justify-between items-center text-[10px] font-semibold text-[#8B949E]">
                  <span className="uppercase">{item.name}</span>
                  <span>{formatVal(item.val)}</span>
                </div>
                <div className="h-4 bg-[#0D1117] border border-[#21262D] relative w-full overflow-hidden">
                  {/* 0.0 Center alignment line */}
                  <div className="absolute left-1/2 w-[1px] h-full bg-[#21262D] z-10"></div>
                  {/* The bar */}
                  <div 
                    className={`absolute h-full ${bar.isPositive ? 'bg-[#6366F1]' : 'bg-[#F59E0B]'}`}
                    style={{ ...bar.style, width: bar.width }}
                  />
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
              Deconstructs the composite confluence score into five category attributions. Shows which technical dimension is driving current alignment.
            </p>
          </div>
          <div>
            <span className="text-[9px] text-[#6366F1] font-bold uppercase tracking-wider block">HOW TO CONSIDER</span>
            <p className="text-xs text-[#8B949E] leading-relaxed mt-0.5">
              Observe which factors are aligned (positive/indigo) or diverging (negative/amber). Total sum equals the Confluence Score ({composite >= 0 ? '+' : ''}{composite.toFixed(2)}).
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#21262D] pt-3 mt-4 select-none flex justify-between items-center text-[9px] text-[#8B949E] uppercase font-mono font-bold tracking-wider">
        <span>MODEL: LINEAR ATTRIBUTION</span>
        <span className="font-mono text-white">SCORE: {composite >= 0 ? '+' : ''}{composite.toFixed(2)}</span>
      </div>
    </div>
  );
}
