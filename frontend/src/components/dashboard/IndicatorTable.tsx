'use client';

import React, { useState } from 'react';
import { ArrowUpDown, HelpCircle } from 'lucide-react';
import { TechnicalAnalysisResponseType, SignalType } from '../../types/analysis.types';

interface TableProps {
  analysis: TechnicalAnalysisResponseType;
}

type StrengthRank = 'none' | 'weak' | 'moderate' | 'strong';

const STRENGTH_VALUES: Record<StrengthRank, number> = {
  none: 0,
  weak: 1,
  moderate: 2,
  strong: 3
};

export default function IndicatorTable({ analysis }: TableProps) {
  const { signals } = analysis;
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Parse all indicator rows
  const initialRows = [
    { name: 'RSI (14)', queryKey: 'RSI' },
    { name: 'MACD (12/26/9)', queryKey: 'MACD' },
    { name: 'Stochastic RSI', queryKey: 'Stoch' },
    { name: 'SMA 50', queryKey: 'SMA 50' },
    { name: 'SMA 200', queryKey: 'SMA Trend' },
    { name: 'EMA 50', queryKey: 'EMA 50' },
    { name: 'EMA 200', queryKey: 'EMA 200' },
    { name: 'Bollinger %B', queryKey: 'Bollinger %B' },
    { name: 'Bollinger Bandwidth', queryKey: 'Bollinger Bandwidth' },
    { name: 'ADX (14)', queryKey: 'ADX' },
    { name: 'OBV', queryKey: 'OBV' }
  ].map(row => {
    const matchedSignal = signals.find(s => s.indicator.toLowerCase().includes(row.queryKey.toLowerCase()));
    
    return {
      indicator: row.name,
      value: matchedSignal?.value ?? 'N/A',
      signal: matchedSignal?.signal ?? 'No Signal',
      direction: matchedSignal?.direction ?? 'neutral',
      strength: (matchedSignal?.strength ?? 'none') as StrengthRank
    };
  });

  const [tableRows, setTableRows] = useState(initialRows);

  // Toggle sorting by Strength rank
  const handleSortStrength = () => {
    let nextDir: 'asc' | 'desc' | null = null;
    if (sortDirection === null) nextDir = 'desc';
    else if (sortDirection === 'desc') nextDir = 'asc';
    else nextDir = null;

    setSortDirection(nextDir);

    if (nextDir === null) {
      setTableRows(initialRows);
    } else {
      const sorted = [...tableRows].sort((a, b) => {
        const valA = STRENGTH_VALUES[a.strength];
        const valB = STRENGTH_VALUES[b.strength];
        return nextDir === 'desc' ? valB - valA : valA - valB;
      });
      setTableRows(sorted);
    }
  };

  const getDirectionBadge = (dir: 'bullish' | 'bearish' | 'neutral') => {
    if (dir === 'bullish') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
          Bullish
        </span>
      );
    }
    if (dir === 'bearish') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
          Bearish
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/50 uppercase tracking-wider">
        Neutral
      </span>
    );
  };

  const getStrengthBadge = (strength: StrengthRank) => {
    if (strength === 'strong') {
      return <span className="text-rose-400 font-bold uppercase text-[10px] tracking-wider">Strong</span>;
    }
    if (strength === 'moderate') {
      return <span className="text-amber-400 font-semibold uppercase text-[10px] tracking-wider">Moderate</span>;
    }
    if (strength === 'weak') {
      return <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">Weak</span>;
    }
    return <span className="text-slate-600 uppercase text-[10px] tracking-wider">None</span>;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Technical Indicators Summary</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-bold uppercase text-slate-400 tracking-wider">
              <th className="py-3.5 px-4 font-semibold">Indicator</th>
              <th className="py-3.5 px-4 font-semibold">Value</th>
              <th className="py-3.5 px-4 font-semibold">Signal Analysis</th>
              <th className="py-3.5 px-4 font-semibold">Direction</th>
              <th className="py-3.5 px-4 font-semibold">
                <button
                  onClick={handleSortStrength}
                  className="inline-flex items-center gap-1 hover:text-white transition duration-150"
                >
                  Strength
                  <ArrowUpDown size={13} className={sortDirection ? 'text-sky-400' : 'text-slate-500'} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
            {tableRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/20 transition duration-150">
                <td className="py-3.5 px-4 font-semibold text-slate-200">{row.indicator}</td>
                <td className="py-3.5 px-4 text-slate-400 tabular-nums">{row.value}</td>
                <td className="py-3.5 px-4 text-slate-300">{row.signal}</td>
                <td className="py-3.5 px-4">{getDirectionBadge(row.direction)}</td>
                <td className="py-3.5 px-4">{getStrengthBadge(row.strength)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
