import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import { DivergenceType } from '../../types/analysis.types';

interface DivergenceProps {
  divergences: DivergenceType[];
}

export default function DivergenceAlert({ divergences }: DivergenceProps) {
  if (divergences.length === 0) return null;

  const getDivergenceBadgeColor = (strength: string) => {
    if (strength === 'strong') return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    if (strength === 'moderate') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {divergences.map((div, idx) => {
        const isBullish = div.type.startsWith('bullish');
        const alertTitle = div.type.replace('_', ' ').toUpperCase();

        return (
          <div
            key={idx}
            className={`border rounded-xl p-4 flex gap-3 shadow-sm ${
              isBullish
                ? 'bg-sky-500/5 border-sky-500/20 text-sky-700 dark:text-sky-300'
                : 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isBullish ? <Info size={18} className="text-sky-500" /> : <AlertTriangle size={18} className="text-amber-500" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {alertTitle}
                </span>
                <span
                  className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 border rounded-full ${getDivergenceBadgeColor(
                    div.strength
                  )}`}
                >
                  {div.strength}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {div.description}
              </p>
            </div>
          </div>
        );
      })}
      
      {/* Footer disclaimer */}
      <span className="text-[10px] text-muted-foreground/80 italic text-center mt-1">
        Divergences are educational observations, not trading signals.
      </span>
    </div>
  );
}
