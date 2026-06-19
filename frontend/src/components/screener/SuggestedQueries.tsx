'use client';

import { useEffect, useState } from 'react';
import { Zap, TrendingUp, Target, BarChart2, Star, ArrowUpRight, Activity } from 'lucide-react';
import { ScreenerSuggestion } from '@/types/screener';
import { fetchSuggestions } from '@/services/screenerService';

interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
  isLoading: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  above_20sma_down4: <Target size={13} />,
  sma_cross_50_100: <TrendingUp size={13} />,
  largecap_it_rsi40: <BarChart2 size={13} />,
  above_200sma_vol2x: <Activity size={13} />,
  breakout_rsi60: <ArrowUpRight size={13} />,
  new_52w_high: <Star size={13} />,
  macd_bullish: <Zap size={13} />,
  pharma_rsi_os: <Target size={13} />,
  golden_cross: <TrendingUp size={13} />,
};

export function SuggestedQueries({ onSelect, isLoading }: SuggestedQueriesProps) {
  const [suggestions, setSuggestions] = useState<ScreenerSuggestion[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchSuggestions().then(s => {
      setSuggestions(s);
      // Staggered entry animation
      setTimeout(() => setVisible(true), 100);
    });
  }, []);

  if (suggestions.length === 0) return null;

  return (
    <div className="w-full">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Try a query
      </p>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <button
            key={s.id}
            id={`suggestion-${s.id}`}
            type="button"
            onClick={() => !isLoading && onSelect(s.query)}
            disabled={isLoading}
            className="group flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/60 hover:bg-primary/10 hover:text-primary hover:shadow-primary/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              transitionDelay: `${i * 40}ms`,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(8px)',
              transition: `opacity 0.3s ease ${i * 40}ms, transform 0.3s ease ${i * 40}ms, border-color 0.2s, background-color 0.2s, color 0.2s`,
            }}
            aria-label={`Run query: ${s.query}`}
          >
            <span className="text-primary/70 group-hover:text-primary transition-colors">
              {ICON_MAP[s.id] ?? <Zap size={13} />}
            </span>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
