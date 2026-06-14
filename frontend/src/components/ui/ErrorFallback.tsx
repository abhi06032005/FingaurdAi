import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorFallbackProps {
  onRetry?: () => void;
}

export default function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-lg mx-auto my-12">
      <div className="p-3 bg-red-500/10 text-red-500 rounded-full mb-4 border border-red-500/20">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-2">
        Unable to Load Analysis
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        Unable to load technical analysis. The market may be closed or data is temporarily unavailable. 
        Please verify your connection and try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl transition duration-150 border border-slate-700 active:scale-[0.98]"
        >
          Retry Load
        </button>
      )}
    </div>
  );
}
