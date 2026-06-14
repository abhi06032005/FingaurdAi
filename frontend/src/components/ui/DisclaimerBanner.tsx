import React from 'react';

/**
 * A non-dismissible educational legal disclaimer banner docked at the bottom of the viewport.
 */
export default function DisclaimerBanner() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-900 border-t border-slate-800 px-4 py-2.5 text-center shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <span className="inline-flex items-center justify-center bg-amber-500/10 text-amber-500 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase border border-amber-500/20">
          Disclaimer
        </span>
        <p className="text-[11px] text-slate-400 leading-normal max-w-5xl">
          This platform is for educational purposes only. Nothing on this site constitutes financial advice, 
          investment recommendations, or solicitation to trade securities. Always consult a SEBI-registered 
          financial advisor before making any financial decisions.
        </p>
      </div>
    </div>
  );
}
