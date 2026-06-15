import React from 'react';
import { TrendingUp, Activity, BarChart2 } from 'lucide-react';
import { TechnicalAnalysisResponseType } from '../../types/analysis.types';

interface OverviewProps {
  analysis: TechnicalAnalysisResponseType;
}

export default function OverviewCards({ analysis }: OverviewProps) {
  const { indicators, signals } = analysis;

  // Helpers to fetch specific indicator signal direction/text
  const getSignalFor = (indicatorName: string) => {
    return signals.find(s => s.indicator.toLowerCase().includes(indicatorName.toLowerCase()));
  };

  const rsiSig = getSignalFor('rsi');
  const macdSig = getSignalFor('macd');
  const maSig = getSignalFor('sma trend') || getSignalFor('sma crossover') || getSignalFor('sma 50');
  const bbSig = getSignalFor('bollinger');
  const adxSig = getSignalFor('adx');
  const obvSig = getSignalFor('obv');

  // 1. Trend Card Logic
  const adxValue = indicators.adx ? Math.round(indicators.adx.adx) : 'N/A';
  let trendDirection: 'bullish' | 'bearish' | 'neutral' = maSig?.direction || 'neutral';
  let trendSummary = `ADX Trend Strength: ${adxValue}`;
  if (maSig) {
    trendSummary += ` (${maSig.signal})`;
  }

  // 2. Momentum Card Logic
  const rsiValue = indicators.rsi ? Math.round(indicators.rsi) : 'N/A';
  let momentumDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (rsiSig?.direction === 'bullish' || macdSig?.direction === 'bullish') {
    momentumDirection = 'bullish';
  } else if (rsiSig?.direction === 'bearish' || macdSig?.direction === 'bearish') {
    momentumDirection = 'bearish';
  }
  let momentumSummary = `RSI (14): ${rsiValue}`;
  if (macdSig) {
    momentumSummary += ` | ${macdSig.signal}`;
  }

  // 3. Volatility Card Logic
  const atrValue = indicators.atr ? indicators.atr.toFixed(2) : 'N/A';
  let volatilityDirection: 'bullish' | 'bearish' | 'neutral' = bbSig?.direction || 'neutral';
  let volatilitySummary = `ATR: ${atrValue}`;
  if (bbSig) {
    volatilitySummary += ` (${bbSig.signal})`;
  }

  // 4. Volume Card Logic
  const obvSlope = indicators.obv ? indicators.obv.slope : 'flat';
  let volumeDirection: 'bullish' | 'bearish' | 'neutral' = obvSig?.direction || 'neutral';
  let volumeSummary = `OBV Slope is ${obvSlope}`;
  if (obvSig) {
    volumeSummary = obvSig.signal;
  }

  // Border and badge color mapping
  const getColorClasses = (dir: 'bullish' | 'bearish' | 'neutral') => {
    if (dir === 'bullish') {
      return {
        border: 'border-l-4 border-l-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      };
    }
    if (dir === 'bearish') {
      return {
        border: 'border-l-4 border-l-rose-500',
        badge: 'bg-rose-500/10 text-rose-650 dark:text-rose-400 border-rose-500/20'
      };
    }
    return {
      border: 'border-l-4 border-l-muted-foreground/40',
      badge: 'bg-muted text-muted-foreground border-border'
    };
  };

  const trendCols = getColorClasses(trendDirection);
  const momentumCols = getColorClasses(momentumDirection);
  const volatilityCols = getColorClasses(volatilityDirection);
  const volumeCols = getColorClasses(volumeDirection);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Trend Card */}
      <div className={`bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-[130px] transition duration-200 hover:border-muted-foreground/30 ${trendCols.border}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trend Analysis</span>
          <TrendingUp className="text-muted-foreground" size={18} />
        </div>
        <div className="my-2">
          <p className="text-sm font-semibold text-foreground truncate">{trendSummary}</p>
        </div>
        <div className="flex">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${trendCols.badge} uppercase tracking-wider`}>
            {trendDirection}
          </span>
        </div>
      </div>

      {/* Momentum Card */}
      <div className={`bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-[130px] transition duration-200 hover:border-muted-foreground/30 ${momentumCols.border}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Momentum</span>
          <TrendingUp className="text-muted-foreground rotate-90" size={18} />
        </div>
        <div className="my-2">
          <p className="text-sm font-semibold text-foreground truncate">{momentumSummary}</p>
        </div>
        <div className="flex">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${momentumCols.badge} uppercase tracking-wider`}>
            {momentumDirection}
          </span>
        </div>
      </div>

      {/* Volatility Card */}
      <div className={`bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-[130px] transition duration-200 hover:border-muted-foreground/30 ${volatilityCols.border}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Volatility</span>
          <Activity className="text-muted-foreground" size={18} />
        </div>
        <div className="my-2">
          <p className="text-sm font-semibold text-foreground truncate">{volatilitySummary}</p>
        </div>
        <div className="flex">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${volatilityCols.badge} uppercase tracking-wider`}>
            {volatilityDirection}
          </span>
        </div>
      </div>

      {/* Volume Card */}
      <div className={`bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-[130px] transition duration-200 hover:border-muted-foreground/30 ${volumeCols.border}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Volume & obv</span>
          <BarChart2 className="text-muted-foreground" size={18} />
        </div>
        <div className="my-2">
          <p className="text-sm font-semibold text-foreground truncate">{volumeSummary}</p>
        </div>
        <div className="flex">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${volumeCols.badge} uppercase tracking-wider`}>
            {volumeDirection}
          </span>
        </div>
      </div>
    </div>
  );
}
