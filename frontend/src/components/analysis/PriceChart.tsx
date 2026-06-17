'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries
} from 'lightweight-charts';
import { Eye, EyeOff, BarChart2 } from 'lucide-react';

interface PriceChartProps {
  symbol: string;
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Client-side Indicator Calculations for Plotting
function computeSMA(data: CandleData[], period: number) {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue;
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    sma.push({ time: data[i].time, value: sum / period });
  }
  return sma;
}

function computeEMA(data: CandleData[], period: number) {
  const ema = [];
  const k = 2 / (period + 1);
  if (data.length >= period) {
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i].close;
    }
    let currentEma = sum / period;
    ema.push({ time: data[period - 1].time, value: currentEma });
    for (let i = period; i < data.length; i++) {
      currentEma = data[i].close * k + currentEma * (1 - k);
      ema.push({ time: data[i].time, value: currentEma });
    }
  }
  return ema;
}

function computeBollingerBands(data: CandleData[], period = 20, multiplier = 2) {
  const bands = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue;
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const mean = sum / period;
    let sumSq = 0;
    for (let j = 0; j < period; j++) {
      sumSq += Math.pow(data[i - j].close - mean, 2);
    }
    const std = Math.sqrt(sumSq / period);
    bands.push({
      time: data[i].time,
      upper: mean + multiplier * std,
      middle: mean,
      lower: mean - multiplier * std,
    });
  }
  return bands;
}

function computeVWAP(data: CandleData[], period = 20) {
  const vwap = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - period + 1);
    let sumTPV = 0;
    let sumV = 0;
    const tps = [];
    for (let j = start; j <= i; j++) {
      const tp = (data[j].high + data[j].low + data[j].close) / 3;
      tps.push(tp);
      sumTPV += tp * data[j].volume;
      sumV += data[j].volume;
    }
    const val = sumV === 0 ? data[i].close : sumTPV / sumV;
    let devSum = 0;
    for (let j = 0; j < tps.length; j++) {
      devSum += Math.pow(tps[j] - val, 2);
    }
    const std = Math.sqrt(devSum / tps.length);
    vwap.push({
      time: data[i].time,
      value: val,
      upper: val + std,
      lower: val - std
    });
  }
  return vwap;
}

function computeIchimoku(data: CandleData[]) {
  const ichimoku = [];
  const tenkanPeriod = 9;
  const kijunPeriod = 26;
  const senkouBPeriod = 52;

  const tenkanVals: number[] = [];
  const kijunVals: number[] = [];

  for (let i = 0; i < data.length; i++) {
    // Tenkan
    const tStart = Math.max(0, i - tenkanPeriod + 1);
    const tHigh = Math.max(...data.slice(tStart, i + 1).map(d => d.high));
    const tLow = Math.min(...data.slice(tStart, i + 1).map(d => d.low));
    tenkanVals.push((tHigh + tLow) / 2);

    // Kijun
    const kStart = Math.max(0, i - kijunPeriod + 1);
    const kHigh = Math.max(...data.slice(kStart, i + 1).map(d => d.high));
    const kLow = Math.min(...data.slice(kStart, i + 1).map(d => d.low));
    kijunVals.push((kHigh + kLow) / 2);
  }

  for (let i = 0; i < data.length; i++) {
    const prevIdx = i - 26;
    let senkouA = (tenkanVals[i] + kijunVals[i]) / 2;
    let senkouB = senkouA;

    if (prevIdx >= 0) {
      senkouA = (tenkanVals[prevIdx] + kijunVals[prevIdx]) / 2;
      const bStart = Math.max(0, prevIdx - senkouBPeriod + 1);
      const bHigh = Math.max(...data.slice(bStart, prevIdx + 1).map(d => d.high));
      const bLow = Math.min(...data.slice(bStart, prevIdx + 1).map(d => d.low));
      senkouB = (bHigh + bLow) / 2;
    }

    ichimoku.push({
      time: data[i].time,
      senkouA,
      senkouB,
    });
  }
  return ichimoku;
}

function computeMACD(data: CandleData[], fast = 12, slow = 26, signal = 9) {
  const closes = data.map(d => d.close);
  const fastEma = computeEMA(data, fast);
  const slowEma = computeEMA(data, slow);
  
  // Align fast and slow by time
  const macdLine = [];
  const timeMap: Record<string, number> = {};
  
  fastEma.forEach(f => { timeMap[f.time] = f.value; });
  
  const macdDataRaw: { time: string; value: number }[] = [];
  slowEma.forEach(s => {
    const fVal = timeMap[s.time];
    if (fVal !== undefined) {
      macdDataRaw.push({ time: s.time, value: fVal - s.value });
    }
  });

  // Calculate EMA of macdDataRaw
  const k = 2 / (signal + 1);
  const signalLine: { time: string; value: number }[] = [];
  const histogram: { time: string; value: number }[] = [];

  if (macdDataRaw.length >= signal) {
    let sum = 0;
    for (let i = 0; i < signal; i++) {
      sum += macdDataRaw[i].value;
    }
    let currentSignal = sum / signal;
    signalLine.push({ time: macdDataRaw[signal - 1].time, value: currentSignal });
    histogram.push({
      time: macdDataRaw[signal - 1].time,
      value: macdDataRaw[signal - 1].value - currentSignal
    });

    for (let i = signal; i < macdDataRaw.length; i++) {
      currentSignal = macdDataRaw[i].value * k + currentSignal * (1 - k);
      signalLine.push({ time: macdDataRaw[i].time, value: currentSignal });
      histogram.push({
        time: macdDataRaw[i].time,
        value: macdDataRaw[i].value - currentSignal
      });
    }
  }

  return { macdLine: macdDataRaw, signalLine, histogram };
}

function computeRSI(data: CandleData[], period = 14) {
  const rsi = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push({ time: data[i].time, value: 100 - 100 / (1 + rs) });
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push({ time: data[i].time, value: 100 - 100 / (1 + rs) });
    }
  }
  return rsi;
}

export default function PriceChart({ symbol }: PriceChartProps) {
  const priceContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);

  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSma20, setShowSma20] = useState(false);
  const [showSma50, setShowSma50] = useState(false);
  const [showSma200, setShowSma200] = useState(false);
  const [showEma9, setShowEma9] = useState(false);
  const [showEma21, setShowEma21] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showVwap, setShowVwap] = useState(false);

  useEffect(() => {
    let active = true;
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
      : 'http://localhost:4000/api';
    
    // Fetch candle data (300 days for SMA-200 validity)
    fetch(`${API_BASE_URL}/stocks/${symbol}/candles?limit=300`)
      .then(res => res.json())
      .then(res => {
        if (active) {
          setCandles(res.candles || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [symbol]);

  useEffect(() => {
    if (candles.length === 0 || !priceContainerRef.current || !macdContainerRef.current || !rsiContainerRef.current) return;

    priceContainerRef.current.innerHTML = '';
    macdContainerRef.current.innerHTML = '';
    rsiContainerRef.current.innerHTML = '';

    const sorted = [...candles].sort((a, b) => a.time.localeCompare(b.time));

    // Shared options
    const baseOptions = {
      layout: {
        background: { color: '#161B22' },
        textColor: '#8B949E',
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: '#21262D' },
        horzLines: { color: '#21262D' },
      },
      rightPriceScale: {
        borderColor: '#21262D',
      },
      timeScale: {
        borderColor: '#21262D',
      },
      crosshair: {
        vertLine: { color: '#8B949E', width: 1, style: 3 },
        horzLine: { color: '#8B949E', width: 1, style: 3 },
      }
    };

    // 1. Price Chart
    const priceChart = createChart(priceContainerRef.current, {
      ...baseOptions,
      width: priceContainerRef.current.clientWidth,
      height: 280,
      timeScale: {
        ...baseOptions.timeScale,
        visible: false, // hide time scale on price chart
      }
    } as any);

    const candleSeries = priceChart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444'
    });
    candleSeries.setData(sorted);

    // 2. MACD Chart
    const macdChart = createChart(macdContainerRef.current, {
      ...baseOptions,
      width: macdContainerRef.current.clientWidth,
      height: 110,
      timeScale: {
        ...baseOptions.timeScale,
        visible: false,
      }
    } as any);

    const macd = computeMACD(sorted);
    
    const macdLineSeries = macdChart.addSeries(LineSeries, { color: '#6366F1', lineWidth: 2, title: 'MACD' });
    macdLineSeries.setData(macd.macdLine);

    const macdSignalSeries = macdChart.addSeries(LineSeries, { color: '#F59E0B', lineWidth: 2, title: 'Signal' });
    macdSignalSeries.setData(macd.signalLine);

    const macdHistSeries = macdChart.addSeries(HistogramSeries, { title: 'Histogram' });
    macdHistSeries.setData(macd.histogram.map(h => ({
      time: h.time,
      value: h.value,
      color: h.value >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
    })));

    // 3. RSI Chart
    const rsiChart = createChart(rsiContainerRef.current, {
      ...baseOptions,
      width: rsiContainerRef.current.clientWidth,
      height: 110,
      timeScale: {
        ...baseOptions.timeScale,
        visible: true,
      }
    } as any);

    const rsiData = computeRSI(sorted);
    const rsiLineSeries = rsiChart.addSeries(LineSeries, { color: '#6366F1', lineWidth: 2, title: 'RSI' });
    rsiLineSeries.setData(rsiData);

    // RSI Levels (30/50/70)
    const rsi70Series = rsiChart.addSeries(LineSeries, { color: '#EF4444', lineWidth: 1, lineStyle: 3 });
    rsi70Series.setData(sorted.map(d => ({ time: d.time, value: 70 })));

    const rsi50Series = rsiChart.addSeries(LineSeries, { color: '#8B949E', lineWidth: 1, lineStyle: 3 });
    rsi50Series.setData(sorted.map(d => ({ time: d.time, value: 50 })));

    const rsi30Series = rsiChart.addSeries(LineSeries, { color: '#10B981', lineWidth: 1, lineStyle: 3 });
    rsi30Series.setData(sorted.map(d => ({ time: d.time, value: 30 })));

    // Indicators Overlays
    const sma20 = computeSMA(sorted, 20);
    const sma50 = computeSMA(sorted, 50);
    const sma200 = computeSMA(sorted, 200);
    const ema9 = computeEMA(sorted, 9);
    const ema21 = computeEMA(sorted, 21);
    const bbVal = computeBollingerBands(sorted, 20, 2);
    const vwapVal = computeVWAP(sorted, 20);
    // Ichimoku removed from chart UI (deprecated — snapshot mode is misleading)


    // SMA Series
    const sma20Series = priceChart.addSeries(LineSeries, { color: '#38BDF8', lineWidth: 2 });
    if (showSma20) sma20Series.setData(sma20);
    const sma50Series = priceChart.addSeries(LineSeries, { color: '#FBBF24', lineWidth: 2 });
    if (showSma50) sma50Series.setData(sma50);
    const sma200Series = priceChart.addSeries(LineSeries, { color: '#F87171', lineWidth: 2 });
    if (showSma200) sma200Series.setData(sma200);

    // EMA Series
    const ema9Series = priceChart.addSeries(LineSeries, { color: '#A78BFA', lineWidth: 2 });
    if (showEma9) ema9Series.setData(ema9);
    const ema21Series = priceChart.addSeries(LineSeries, { color: '#34D399', lineWidth: 2 });
    if (showEma21) ema21Series.setData(ema21);

    // Bollinger Bands Series
    const bbUpperSeries = priceChart.addSeries(LineSeries, { color: '#6366F1', lineWidth: 1, lineStyle: 2 });
    const bbLowerSeries = priceChart.addSeries(LineSeries, { color: '#6366F1', lineWidth: 1, lineStyle: 2 });
    if (showBB) {
      bbUpperSeries.setData(bbVal.map(b => ({ time: b.time, value: b.upper })));
      bbLowerSeries.setData(bbVal.map(b => ({ time: b.time, value: b.lower })));
    }

    // VWAP Series
    const vwapLineSeries = priceChart.addSeries(LineSeries, { color: '#14B8A6', lineWidth: 2 });
    if (showVwap) vwapLineSeries.setData(vwapVal);

    // Ichimoku removed from UI (deprecated — snapshot mode is misleading without full cloud visualization)


    // Synchronize time ranges
    let isSyncing = false;
    const syncCharts = (src: IChartApi, targets: IChartApi[]) => {
      src.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (isSyncing || !range) return;
        isSyncing = true;
        targets.forEach(t => t.timeScale().setVisibleLogicalRange(range));
        isSyncing = false;
      });
    };

    syncCharts(priceChart, [macdChart, rsiChart]);
    syncCharts(macdChart, [priceChart, rsiChart]);
    syncCharts(rsiChart, [priceChart, macdChart]);

    // Fit content initially
    priceChart.timeScale().fitContent();

    // Resize Handler
    const handleResize = () => {
      if (!priceContainerRef.current) return;
      const w = priceContainerRef.current.clientWidth;
      priceChart.resize(w, 280);
      macdChart.resize(w, 110);
      rsiChart.resize(w, 110);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      priceChart.remove();
      macdChart.remove();
      rsiChart.remove();
    };
  }, [
    candles,
    showSma20,
    showSma50,
    showSma200,
    showEma9,
    showEma21,
    showBB,
    showVwap
  ]);

  if (loading) {
    return (
      <div className="bg-[#161B22] border border-[#21262D] h-[550px] flex flex-col items-center justify-center select-none text-[#8B949E] font-sans">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 animate-spin mb-3"></div>
        <p className="text-xs uppercase tracking-wider">Syncing technical database charts...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#161B22] border border-[#21262D] p-5 flex flex-col justify-between h-[620px] select-none font-sans">
      {/* Overlay Toggle Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 select-none">
        <div>
          <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <BarChart2 size={13} className="text-indigo-400" />
            Institutional Chart Engine
          </h3>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setShowSma20(!showSma20)}
            className={`px-2 py-1 border transition-all duration-200 cursor-pointer ${showSma20 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-[#0D1117] text-[#8B949E] border-[#21262D] hover:text-white'}`}
          >
            SMA 20
          </button>
          <button
            onClick={() => setShowSma50(!showSma50)}
            className={`px-2 py-1 border transition-all duration-200 cursor-pointer ${showSma50 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-[#0D1117] text-[#8B949E] border-[#21262D] hover:text-white'}`}
          >
            SMA 50
          </button>
          <button
            onClick={() => setShowSma200(!showSma200)}
            className={`px-2 py-1 border transition-all duration-200 cursor-pointer ${showSma200 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-[#0D1117] text-[#8B949E] border-[#21262D] hover:text-white'}`}
          >
            SMA 200
          </button>
          <button
            onClick={() => setShowEma9(!showEma9)}
            className={`px-2 py-1 border transition-all duration-200 cursor-pointer ${showEma9 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-[#0D1117] text-[#8B949E] border-[#21262D] hover:text-white'}`}
          >
            EMA 9
          </button>
          <button
            onClick={() => setShowEma21(!showEma21)}
            className={`px-2 py-1 border transition-all duration-200 cursor-pointer ${showEma21 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-[#0D1117] text-[#8B949E] border-[#21262D] hover:text-white'}`}
          >
            EMA 21
          </button>
          <button
            onClick={() => setShowBB(!showBB)}
            className={`px-2 py-1 border transition-all duration-200 cursor-pointer ${showBB ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-[#0D1117] text-[#8B949E] border-[#21262D] hover:text-white'}`}
          >
            BB
          </button>
          <button
            onClick={() => setShowVwap(!showVwap)}
            className={`px-2 py-1 border transition-all duration-200 cursor-pointer ${showVwap ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-[#0D1117] text-[#8B949E] border-[#21262D] hover:text-white'}`}
          >
            VWAP
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 flex flex-col gap-2 w-full select-none overflow-hidden">
        {/* Pane 1: Candle Plot */}
        <div ref={priceContainerRef} className="w-full h-[280px] relative border-b border-[#21262D]" />
        
        {/* Pane 2: MACD Plot */}
        <div className="w-full relative border-b border-[#21262D]">
          <div className="absolute top-1 left-2 text-xs font-mono text-[#8B949E] z-10 bg-[#161B22]/80 px-1.5 py-0.5 border border-[#21262D]/40">MACD Histogram (12, 26, 9)</div>
          <div ref={macdContainerRef} className="w-full h-[110px]" />
        </div>

        {/* Pane 3: RSI Plot */}
        <div className="w-full relative">
          <div className="absolute top-1 left-2 text-xs font-mono text-[#8B949E] z-10 bg-[#161B22]/80 px-1.5 py-0.5 border border-[#21262D]/40">RSI (14) - Compressed / Neutral / Elevated</div>
          <div ref={rsiContainerRef} className="w-full h-[110px]" />
        </div>
      </div>
    </div>
  );
}
