'use client';

import React from 'react';
import { Cpu, RotateCw } from 'lucide-react';

interface SummaryProps {
  summary: string | null;
  generatedAt: string | null;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function EducationalSummaryCard({ summary, generatedAt, onRefresh, isLoading }: SummaryProps) {
  
  // Custom parser to format bold headers like "**Heading** — description"
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    return lines.map((line, idx) => {
      // Check if line contains markdown bold headings **Header**
      const match = line.match(/^\*\*(.*?)\*\*(.*)/);
      
      if (match) {
        const header = match[1];
        const restOfText = match[2];

        return (
          <p key={idx} className="text-xs text-slate-300 leading-relaxed mb-3.5">
            <strong className="text-white font-semibold block text-sm mb-1">{header}</strong>
            <span className="text-slate-300">{restOfText.trim().replace(/^—\s*/, '')}</span>
          </p>
        );
      }

      // Default paragraph
      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed mb-3.5">
          {line}
        </p>
      );
    });
  };

  const formattedDate = generatedAt 
    ? new Date(generatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }) 
    : 'N/A';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl w-full flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-850">
          <div className="flex items-center gap-2">
            <Cpu className="text-indigo-400" size={18} />
            <h3 className="text-base font-bold text-white tracking-tight">AI Educational Summary</h3>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition duration-150 ${isLoading ? 'animate-spin opacity-50' : 'active:scale-95'}`}
              title="Refresh AI Analysis"
            >
              <RotateCw size={14} />
            </button>
          )}
        </div>

        {summary ? (
          <div className="space-y-1">
            {renderFormattedText(summary)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 mb-3"></div>
            <p className="text-sm text-slate-400">Analysis generating in background...</p>
            <p className="text-[11px] text-slate-500 mt-1">Please wait or refresh details.</p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-850 pt-4 mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-slate-500">
        <span className="italic font-medium">
          This analysis is purely educational and does not constitute financial advice.
        </span>
        {summary && generatedAt && (
          <span className="font-mono">
            Model: Llama-3.3-70B · Refreshed: {formattedDate}
          </span>
        )}
      </div>
    </div>
  );
}
