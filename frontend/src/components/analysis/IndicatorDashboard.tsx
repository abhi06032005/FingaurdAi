import React from 'react';

interface IndicatorDashboardProps {
  data: {
    priceSnapshot: {
      close: number;
      zScore: number;
      vwap: number;
      vwapDeviation: number;
    };
    classicIndicators: {
      sma: { sma20: number; sma50: number; sma200: number };
      ema: { ema9: number; ema21: number; ema55: number };
      macd: { line: number; signal: number; histogram: number };
      rsi: number;
      bb: { upper: number; mid: number; lower: number; percentB: number; bandwidth: number };
      atr: number;
      stochastic: { k: number; d: number };
      williamsR: number;
      cci: number;
      obv: number;
      volumeRatio: number;
      adx: { adx: number; plusDI: number; minusDI: number };
    };
    quantModels: {
      volumeProfile: { pointOfControl: number };
      ichimoku: { position: string };
    };
  };
}

export default function IndicatorDashboard({ data }: IndicatorDashboardProps) {
  const { priceSnapshot, classicIndicators, quantModels } = data;
  const { close } = priceSnapshot;

  // Helpers for labels
  const getSmaAlignment = () => {
    const { sma20, sma50, sma200 } = classicIndicators.sma;
    if (close > sma20 && close > sma50 && close > sma200) return 'Aligned';
    if (close < sma20 && close < sma50 && close < sma200) return 'Aligned';
    return 'Contracting';
  };

  const getEmaRibbonState = () => {
    const { ema9, ema21, ema55 } = classicIndicators.ema;
    if (close > ema9 && close > ema21 && close > ema55) return 'Aligned';
    if (close < ema9 && close < ema21 && close < ema55) return 'Aligned';
    return 'Contracting';
  };

  const getAdxState = () => {
    const { plusDI, minusDI } = classicIndicators.adx;
    return plusDI > minusDI ? 'Aligned' : 'Diverging';
  };

  const getRsiState = (val: number) => {
    if (val > 70) return 'Elevated';
    if (val < 30) return 'Compressed';
    return 'Neutral';
  };

  const getCCIState = (val: number) => {
    if (val > 100) return 'Elevated';
    if (val < -100) return 'Compressed';
    return 'Neutral';
  };

  const getWilliamsState = (val: number) => {
    if (val > -20) return 'Elevated';
    if (val < -80) return 'Compressed';
    return 'Neutral';
  };

  const getMacdSignalState = () => {
    const { line, signal } = classicIndicators.macd;
    return line > signal ? 'Aligned' : 'Diverging';
  };

  const getStochasticState = () => {
    const { k, d } = classicIndicators.stochastic;
    return k > d ? 'Aligned' : 'Diverging';
  };

  const getVolRatioState = (val: number) => {
    if (val > 1.2) return 'Expanding';
    if (val < 0.8) return 'Contracting';
    return 'Neutral';
  };

  const getObvState = () => {
    return 'Aligned'; // neutral term indicating active trend matches price
  };

  const getVwapDevState = () => {
    return priceSnapshot.vwapDeviation > 0.02 ? 'Elevated' : 'Neutral';
  };

  const getPocState = () => {
    return close > quantModels.volumeProfile.pointOfControl ? 'Aligned' : 'Diverging';
  };

  const renderGaugeBar = (pct: number, color = 'bg-[#6366F1]') => {
    const clampPct = Math.max(0, Math.min(100, pct));
    return (
      <div className="w-full h-1 bg-[#21262D] mt-2 relative select-none">
        <div className={`h-full ${color}`} style={{ width: `${clampPct}%` }}></div>
      </div>
    );
  };

  const renderCard = (title: string, value: string, stateLabel: string, gaugePct?: number, gaugeColor?: string) => {
    let stateColor = 'text-[#8B949E]';
    if (stateLabel === 'Aligned' || stateLabel === 'Elevated' || stateLabel === 'Expanding' || stateLabel === 'Above Cloud') {
      stateColor = 'text-[#6366F1]';
    } else if (stateLabel === 'Diverging' || stateLabel === 'Compressed' || stateLabel === 'Contracting' || stateLabel === 'Below Cloud') {
      stateColor = 'text-[#F59E0B]';
    }

    return (
      <div className="bg-[#161B22] border border-[#21262D] p-4 flex flex-col justify-between select-none">
        <div>
          <span className="text-[9px] text-[#8B949E] uppercase tracking-widest font-bold">
            {title}
          </span>
          <div className="font-mono text-lg font-bold text-white mt-1">
            {value}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${stateColor}`}>
            {stateLabel}
          </span>
        </div>
        {gaugePct !== undefined && renderGaugeBar(gaugePct, gaugeColor)}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none font-sans">
      {/* Column 1: Trend */}
      <div className="flex flex-col gap-4">
        <div className="border-l-2 border-[#6366F1] pl-2 py-0.5">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Trend Matrix</h2>
        </div>
        {renderCard('SMA Alignment', `Price vs MAs`, getSmaAlignment())}
        {renderCard('EMA Ribbon State', `Price vs EMAs`, getEmaRibbonState())}
        {renderCard('ADX Indicator', `${classicIndicators.adx.adx.toFixed(1)}`, getAdxState(), (classicIndicators.adx.adx / 50) * 100)}
        {renderCard('Ichimoku Position', `Cloud State`, `${quantModels.ichimoku.position.toUpperCase()} CLOUD`)}
      </div>

      {/* Column 2: Momentum */}
      <div className="flex flex-col gap-4">
        <div className="border-l-2 border-[#6366F1] pl-2 py-0.5">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Momentum Matrix</h2>
        </div>
        {renderCard('RSI (14)', `${classicIndicators.rsi.toFixed(1)}`, getRsiState(classicIndicators.rsi), classicIndicators.rsi)}
        {renderCard('Stoch Oscillator', `%K: ${classicIndicators.stochastic.k.toFixed(1)} / %D: ${classicIndicators.stochastic.d.toFixed(1)}`, getStochasticState(), classicIndicators.stochastic.k, 'bg-[#F59E0B]')}
        {renderCard('Williams %R', `${classicIndicators.williamsR.toFixed(1)}`, getWilliamsState(classicIndicators.williamsR), 100 + classicIndicators.williamsR)}
        {renderCard('MACD Signal', `H: ${classicIndicators.macd.histogram.toFixed(2)}`, getMacdSignalState())}
      </div>

      {/* Column 3: Volatility */}
      <div className="flex flex-col gap-4">
        <div className="border-l-2 border-[#6366F1] pl-2 py-0.5">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Volatility Matrix</h2>
        </div>
        {renderCard('ATR (14)', `${classicIndicators.atr.toFixed(2)}`, 'Neutral')}
        {renderCard('Bollinger Band Width', `${(classicIndicators.bb.bandwidth * 100).toFixed(2)}%`, 'Neutral', classicIndicators.bb.bandwidth * 300)}
        {renderCard('Z-Score', `${priceSnapshot.zScore.toFixed(2)}`, Math.abs(priceSnapshot.zScore) > 1.5 ? 'Elevated' : 'Neutral')}
        {renderCard('Price VWAP Dev', `V: ${priceSnapshot.vwap.toFixed(1)}`, getVwapDevState())}
      </div>

      {/* Column 4: Volume */}
      <div className="flex flex-col gap-4">
        <div className="border-l-2 border-[#6366F1] pl-2 py-0.5">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Volume Matrix</h2>
        </div>
        {renderCard('On-Balance Volume', `${classicIndicators.obv.toLocaleString('en-IN')}`, getObvState())}
        {renderCard('Volume Ratio', `${classicIndicators.volumeRatio.toFixed(2)}x`, getVolRatioState(classicIndicators.volumeRatio), (classicIndicators.volumeRatio / 2.5) * 100)}
        {renderCard('POC Alignment', `POC: ₹${quantModels.volumeProfile.pointOfControl.toFixed(1)}`, getPocState())}
        {renderCard('Composite Vol', `Liquidity State`, 'Aligned')}
      </div>
    </div>
  );
}
