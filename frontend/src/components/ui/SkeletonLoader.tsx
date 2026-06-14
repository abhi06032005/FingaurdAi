import React from 'react';

interface SkeletonProps {
  variant: 'gauge' | 'card' | 'table' | 'chart' | 'summary';
}

export default function SkeletonLoader({ variant }: SkeletonProps) {
  if (variant === 'gauge') {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse h-[280px]">
        <div className="w-48 h-24 rounded-t-full bg-slate-800/60 relative overflow-hidden">
          <div className="absolute inset-x-4 bottom-0 h-16 rounded-t-full bg-slate-900"></div>
        </div>
        <div className="w-16 h-8 bg-slate-800/60 rounded mt-4"></div>
        <div className="w-24 h-4 bg-slate-800/40 rounded mt-2"></div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse flex flex-col justify-between h-[120px]">
        <div className="flex justify-between items-center">
          <div className="w-20 h-4 bg-slate-800/60 rounded"></div>
          <div className="w-6 h-6 bg-slate-800/60 rounded-full"></div>
        </div>
        <div className="w-28 h-6 bg-slate-800/60 rounded"></div>
        <div className="w-16 h-3 bg-slate-800/40 rounded"></div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="w-32 h-6 bg-slate-800/60 rounded mb-6"></div>
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="flex justify-between items-center border-b border-slate-800/40 pb-3">
              <div className="w-24 h-4 bg-slate-800/60 rounded"></div>
              <div className="w-16 h-4 bg-slate-800/40 rounded"></div>
              <div className="w-20 h-5 bg-slate-800/60 rounded-full"></div>
              <div className="w-12 h-4 bg-slate-800/40 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse h-[400px] flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="w-24 h-5 bg-slate-800/60 rounded"></div>
            <div className="w-16 h-5 bg-slate-800/40 rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-12 h-6 bg-slate-800/60 rounded"></div>
            <div className="w-12 h-6 bg-slate-800/60 rounded"></div>
          </div>
        </div>
        <div className="flex-1 bg-slate-800/20 rounded-xl my-4 relative overflow-hidden flex items-end p-2 gap-1.5">
          {Array.from({ length: 24 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-slate-800/30 w-full rounded-t"
              style={{ height: `${Math.floor(Math.random() * 60) + 20}%` }}
            ></div>
          ))}
        </div>
        <div className="flex justify-between">
          <div className="w-16 h-3 bg-slate-800/40 rounded"></div>
          <div className="w-16 h-3 bg-slate-800/40 rounded"></div>
          <div className="w-16 h-3 bg-slate-800/40 rounded"></div>
        </div>
      </div>
    );
  }

  // default variant === 'summary'
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
      <div className="w-40 h-6 bg-slate-800/60 rounded mb-4"></div>
      <div className="w-full h-4 bg-slate-800/60 rounded"></div>
      <div className="w-[92%] h-4 bg-slate-800/60 rounded"></div>
      <div className="w-[96%] h-4 bg-slate-800/40 rounded"></div>
      <div className="w-[85%] h-4 bg-slate-800/40 rounded"></div>
      <div className="w-full h-4 bg-slate-800/60 rounded pt-2"></div>
      <div className="w-[78%] h-4 bg-slate-800/40 rounded"></div>
    </div>
  );
}
