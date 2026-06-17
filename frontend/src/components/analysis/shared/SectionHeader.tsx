import React from 'react';
import InfoTooltip from './InfoTooltip';

interface SectionHeaderProps {
  label: string;
  question: string;
  tooltipTitle?: string;
  tooltipWhat?: string;
  tooltipWhy?: string;
  tooltipHow?: string;
  tooltipLimitation?: string;
  accent?: 'indigo' | 'amber' | 'emerald' | 'white';
  children?: React.ReactNode;
}

const accentColors: Record<string, string> = {
  indigo: 'border-[#6366F1]',
  amber: 'border-[#F59E0B]',
  emerald: 'border-[#10B981]',
  white: 'border-white/30',
};

export default function SectionHeader({
  label,
  question,
  tooltipTitle,
  tooltipWhat,
  tooltipWhy,
  tooltipHow,
  tooltipLimitation,
  accent = 'indigo',
  children
}: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className={`border-l-2 ${accentColors[accent]} pl-3 py-0.5`}>
        <p className="text-xs font-extrabold text-[#8B949E] uppercase tracking-widest mb-1">{label}</p>
        <h2 className="text-base font-bold text-white leading-tight">{question}</h2>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        {children}
        {tooltipTitle && tooltipWhat && tooltipWhy && tooltipHow && (
          <InfoTooltip
            title={tooltipTitle}
            what={tooltipWhat}
            why={tooltipWhy}
            how={tooltipHow}
            limitation={tooltipLimitation}
          />
        )}
      </div>
    </div>
  );
}
