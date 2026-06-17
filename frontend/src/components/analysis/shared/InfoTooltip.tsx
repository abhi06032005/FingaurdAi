"use client";

import React, { useState, useRef } from 'react';

interface InfoTooltipProps {
  title: string;
  what: string;
  why: string;
  how: string;
  limitation?: string;
  currentContext?: string;
}

export default function InfoTooltip({ title, what, why, how, limitation, currentContext }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      // If the button is closer than 320px to the right edge of the screen, open tooltip to the left
      if (windowWidth - rect.left < 320) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  };

  const handleMouseEnter = () => {
    checkPosition();
    setOpen(true);
  };

  const handleToggle = () => {
    checkPosition();
    setOpen(v => !v);
  };

  return (
    <div ref={containerRef} className="relative inline-flex" onMouseLeave={() => setOpen(false)}>
      <button
        aria-label={`Learn about ${title}`}
        onMouseEnter={handleMouseEnter}
        onClick={handleToggle}
        className="w-5.5 h-5.5 rounded-full bg-[#21262D] border border-[#30363D] text-[#8B949E] hover:border-[#6366F1] hover:text-white flex items-center justify-center transition-all duration-150 text-xs font-bold flex-shrink-0 cursor-pointer"
      >
        i
      </button>

      {open && (
        <div className={`absolute z-50 top-7 w-72 bg-[#161B22] border border-[#21262D] shadow-2xl p-4.5 space-y-3 animate-in fade-in duration-150 ${alignRight ? 'right-0' : 'left-0'}`}>
          {/* Arrow */}
          <div className={`absolute -top-1.5 w-2.5 h-2.5 bg-[#161B22] border-l border-t border-[#21262D] rotate-45 ${alignRight ? 'right-3' : 'left-3'}`} />

          <p className="text-xs font-extrabold text-[#6366F1] uppercase tracking-widest">{title}</p>

          <div className="space-y-2.5">
            <div>
              <p className="text-[10px] font-extrabold text-[#8B949E] uppercase tracking-wider mb-0.5">What it measures</p>
              <p className="text-xs text-white leading-relaxed">{what}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[#8B949E] uppercase tracking-wider mb-0.5">Why investors track it</p>
              <p className="text-xs text-[#8B949E] leading-relaxed">{why}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[#8B949E] uppercase tracking-wider mb-0.5">How to read it</p>
              <p className="text-xs text-[#8B949E] leading-relaxed">{how}</p>
            </div>
            {currentContext && (
              <div className="bg-[#0D1117] border border-[#21262D] px-2.5 py-1.5">
                <p className="text-[10px] font-extrabold text-[#6366F1] uppercase tracking-wider mb-0.5">Current reading</p>
                <p className="text-xs text-white font-mono">{currentContext}</p>
              </div>
            )}
            {limitation && (
              <div>
                <p className="text-[10px] font-extrabold text-[#F59E0B] uppercase tracking-wider mb-0.5">Limitation</p>
                <p className="text-xs text-[#8B949E] leading-relaxed">{limitation}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
