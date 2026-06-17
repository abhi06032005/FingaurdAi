import React from 'react';
import { Cpu } from 'lucide-react';

interface AiSummaryProps {
  summary: string;
}

export default function AiSummary({ summary }: AiSummaryProps) {
  return (
    <div className="bg-[#1C2128] border border-[#21262D] border-l-4 border-l-[#6366F1] p-6 select-none font-sans relative overflow-hidden">
      {/* Header and badge */}
      <div className="flex items-center gap-2 border-b border-[#21262D] pb-3 mb-4 select-none">
        <Cpu size={14} className="text-[#6366F1]" />
        <h2 className="text-xs font-bold text-white uppercase tracking-widest">
          Market Context
        </h2>
        <span className="bg-[#6366F1]/10 text-[#6366F1] text-[8px] font-mono font-bold px-2 py-0.5 border border-[#6366F1]/20">
          AI-GENERATED
        </span>
      </div>

      {/* Summary Text Body */}
      <div className="text-sm text-white leading-relaxed font-medium font-sans">
        {summary}
      </div>

      {/* Muted SEBI disclaimer */}
      <div className="mt-5 pt-3 border-t border-[#21262D] flex items-center justify-between text-[9px] text-[#8B949E] uppercase tracking-wider font-semibold select-none">
        <span>Disclaimer: Educational summary only. Not financial advice. Not SEBI-registered research.</span>
      </div>
    </div>
  );
}
