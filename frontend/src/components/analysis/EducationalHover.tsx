import React, { ReactNode } from 'react';

interface EducationalHoverProps {
  title: string;
  measures: string;
  calculation: string;
  relevance: string;
  percentile?: string;
  range?: string;
  children: ReactNode;
}

export default function EducationalHover({
  title,
  measures,
  calculation,
  relevance,
  percentile,
  range,
  children
}: EducationalHoverProps) {
  return (
    <div className="relative group inline-block w-full">
      {children}
      {/* Bloomberg style absolute popover */}
      <div className="absolute hidden group-hover:block bg-[#1C2128] border border-[#21262D] p-4 text-[10px] w-72 z-50 shadow-2xl font-sans text-left pointer-events-none select-none text-[#8B949E] top-full left-0 mt-2">
        <div className="border-b border-[#21262D] pb-1.5 mb-2 flex items-center justify-between">
          <span className="font-bold text-white uppercase tracking-wider">{title}</span>
          <span className="text-[8px] text-[#6366F1] font-mono font-bold tracking-widest uppercase">EDUCATIONAL</span>
        </div>
        
        <div className="space-y-2">
          <div>
            <span className="text-white font-semibold">MEASURES: </span>
            <span>{measures}</span>
          </div>
          <div>
            <span className="text-white font-semibold">CALCULATION: </span>
            <span className="font-mono text-[9px]">{calculation}</span>
          </div>
          <div>
            <span className="text-white font-semibold">RELEVANCE: </span>
            <span>{relevance}</span>
          </div>
          {(percentile || range) && (
            <div className="border-t border-[#21262D] pt-2 mt-2 flex justify-between font-mono text-[9px]">
              {percentile && <span>PCT: {percentile}</span>}
              {range && <span>RANGE: {range}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
