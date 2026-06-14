'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, AreaSeries, LineSeries, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { Eye, EyeOff, Activity } from 'lucide-react';

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

// Client-side SMA calculation
function computeSMA(data: CandleData[], period: number) {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue;
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    sma.push({
      time: data[i].time,
      value: sum / period
    });
  }
  return sma;
}

// Client-side EMA calculation
function computeEMA(data: CandleData[], period: number) {
  const ema = [];
  const k = 2 / (period + 1);
  
  if (data.length >= period) {
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i].close;
    }
    let currentEma = sum / period;
    
    ema.push({
      time: data[period - 1].time,
      value: currentEma
    });

    for (let i = period; i < data.length; i++) {
      currentEma = data[i].close * k + currentEma * (1 - k);
      ema.push({
        time: data[i].time,
        value: currentEma
      });
    }
  }
  return ema;
}

export default function PriceChart({ symbol }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<'Area'> | ISeriesApi<'Candlestick'> | null>(null);
  
  // Line Series Refs
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chart Type & Legend Hover States
  const [chartType, setChartType] = useState<'area' | 'candles'>('area');
  const [hoveredData, setHoveredData] = useState<CandleData | null>(null);

  // Overlay Visibility Toggles
  const [showSma20, setShowSma20] = useState(false);
  const [showSma50, setShowSma50] = useState(false);
  const [showSma200, setShowSma200] = useState(false);
  const [showEma50, setShowEma50] = useState(false);

  // 1. Fetch candle data
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:5000/api';

    fetch(`${API_BASE_URL}/stocks/${symbol}/candles?limit=200`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load candles');
        return res.json();
      })
      .then(res => {
        if (active) {
          setCandles(res.candles || []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [symbol]);

  // Set initial legend data to the latest candle
  useEffect(() => {
    if (candles.length > 0) {
      const sorted = [...candles].sort((a, b) => a.time.localeCompare(b.time));
      setHoveredData(sorted[sorted.length - 1]);
    }
  }, [candles]);

  // 2. Build Chart once container and candles are available
  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    // Clear previous charts to prevent multiple charts from stacking up
    chartContainerRef.current.innerHTML = '';

    // Initialize Chart with custom theme colors for TradingView White Mode
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 420,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#131722',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#f0f3fa' },
        horzLines: { color: '#f0f3fa' },
      },
      rightPriceScale: {
        borderColor: '#e0e3eb',
        visible: true,
      },
      timeScale: {
        borderColor: '#e0e3eb',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: '#787b86',
          width: 1,
          style: 3, // dashed
          labelBackgroundColor: '#787b86',
        },
        horzLine: {
          color: '#787b86',
          width: 1,
          style: 3, // dashed
          labelBackgroundColor: '#787b86',
        },
      },
    });

    chartRef.current = chart;

    const sortedData = [...candles].sort((a, b) => a.time.localeCompare(b.time));

    // Add main price series (White Mode styling)
    let mainSeries;
    if (chartType === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        lineColor: '#2962ff', // TradingView Blue
        topColor: 'rgba(41, 98, 255, 0.18)',
        bottomColor: 'rgba(41, 98, 255, 0.00)',
        lineWidth: 3,
        priceLineVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: '#ffffff',
        crosshairMarkerBackgroundColor: '#2962ff',
      });
      mainSeries.setData(sortedData.map(c => ({
        time: c.time,
        value: c.close
      })));
    } else {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',      // TradingView Green
        downColor: '#ef5350',    // TradingView Red
        borderVisible: true,
        borderColor: '#26a69a',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        wickVisible: true,
        priceLineVisible: false,
      });
      mainSeries.setData(sortedData.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })));
    }
    mainSeriesRef.current = mainSeries;

    // Add Volume Overlay Series (TradingView colors)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume-scale',
    });

    chart.priceScale('volume-scale').applyOptions({
      scaleMargins: {
        top: 0.8, // occupies bottom 20%
        bottom: 0,
      },
      visible: false,
    });

    volumeSeries.setData(sortedData.map(c => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(38, 166, 154, 0.25)' : 'rgba(239, 83, 80, 0.25)',
    })));

    // Subscribe to crosshair move for dynamic legend
    chart.subscribeCrosshairMove(param => {
      if (param.time) {
        const dataAtTime = sortedData.find(c => c.time === param.time);
        if (dataAtTime) {
          setHoveredData(dataAtTime);
        }
      } else {
        const last = sortedData[sortedData.length - 1];
        if (last) {
          setHoveredData(last);
        }
      }
    });

    // Add Line Series Overlays (moving averages)
    const sma20Data = computeSMA(sortedData, 20);
    const sma50Data = computeSMA(sortedData, 50);
    const sma200Data = computeSMA(sortedData, 200);
    const ema50Data = computeEMA(sortedData, 50);

    // SMA 20 (Cyan - slightly darker for white mode legibility)
    const sma20Series = chart.addSeries(LineSeries, { color: '#0891b2', lineWidth: 2, title: 'SMA 20' });
    sma20Series.setData(sma20Data);
    sma20Series.applyOptions({ visible: showSma20 });
    sma20SeriesRef.current = sma20Series;

    // SMA 50 (Amber)
    const sma50Series = chart.addSeries(LineSeries, { color: '#d97706', lineWidth: 2, title: 'SMA 50' });
    sma50Series.setData(sma50Data);
    sma50Series.applyOptions({ visible: showSma50 });
    sma50SeriesRef.current = sma50Series;

    // SMA 200 (Rose)
    const sma200Series = chart.addSeries(LineSeries, { color: '#e11d48', lineWidth: 2, title: 'SMA 200' });
    sma200Series.setData(sma200Data);
    sma200Series.applyOptions({ visible: showSma200 });
    sma200SeriesRef.current = sma200Series;

    // EMA 50 (Emerald)
    const ema50Series = chart.addSeries(LineSeries, { color: '#059669', lineWidth: 2, title: 'EMA 50' });
    ema50Series.setData(ema50Data);
    ema50Series.applyOptions({ visible: showEma50 });
    ema50SeriesRef.current = ema50Series;

    // Fit content
    chart.timeScale().fitContent();

    // Resize Handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.resize(chartContainerRef.current.clientWidth, 420);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, chartType]);
  // 3. Sync state changes with line visibility properties
  useEffect(() => {
    if (sma20SeriesRef.current) sma20SeriesRef.current.applyOptions({ visible: showSma20 });
  }, [showSma20]);

  useEffect(() => {
    if (sma50SeriesRef.current) sma50SeriesRef.current.applyOptions({ visible: showSma50 });
  }, [showSma50]);

  useEffect(() => {
    if (sma200SeriesRef.current) sma200SeriesRef.current.applyOptions({ visible: showSma200 });
  }, [showSma200]);

  useEffect(() => {
    if (ema50SeriesRef.current) ema50SeriesRef.current.applyOptions({ visible: showEma50 });
  }, [showEma50]);

  if (loading) {
    return (
      <div className="bg-[#090d16]/40 backdrop-blur-md border border-white/5 rounded-2xl h-[460px] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <Activity className="w-4 h-4 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-xs text-slate-500">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error || candles.length === 0) {
    return (
      <div className="bg-[#090d16]/40 backdrop-blur-md border border-white/5 rounded-2xl h-[460px] w-full flex items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-450">Unable to load price history. Please try again later.</p>
      </div>
    );
  }
  return (
    <div className="bg-white border border-[#e0e3eb] rounded-2xl p-6 shadow-xl w-full flex flex-col justify-between h-[540px] hover:border-slate-300 transition-all duration-300">
      {/* Chart Headers and Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 select-none">
        <div>
          <h3 className="text-sm font-black text-[#131722] tracking-wider uppercase flex items-center gap-2">
            <Activity size={14} className="text-[#2962ff]" />
            Price History Chart
          </h3>
          <p className="text-[10px] text-[#787b86] mt-0.5">Sleek daily interval closing price {chartType === 'area' ? 'area series' : 'candlestick series'}</p>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          {/* Chart Type Toggles */}
          <div className="flex items-center bg-[#f0f3fa] rounded-lg p-0.5 border border-[#e0e3eb] gap-0.5 mr-2">
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-md font-bold uppercase text-[9px] tracking-wider transition-all duration-200 cursor-pointer ${chartType === 'area' ? 'bg-white text-[#2962ff] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#e0e3eb]' : 'text-[#787b86] hover:text-[#131722]'}`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('candles')}
              className={`px-2.5 py-1 rounded-md font-bold uppercase text-[9px] tracking-wider transition-all duration-200 cursor-pointer ${chartType === 'candles' ? 'bg-white text-[#2962ff] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#e0e3eb]' : 'text-[#787b86] hover:text-[#131722]'}`}
            >
              Candles
            </button>
          </div>

          <button
            onClick={() => setShowSma20(!showSma20)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${showSma20 ? 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-sm' : 'bg-white text-[#787b86] border-[#e0e3eb] hover:bg-[#f8f9fa] hover:text-[#131722]'}`}
          >
            {showSma20 ? <Eye size={11} /> : <EyeOff size={11} />}
            SMA 20
          </button>
          <button
            onClick={() => setShowSma50(!showSma50)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${showSma50 ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm' : 'bg-white text-[#787b86] border-[#e0e3eb] hover:bg-[#f8f9fa] hover:text-[#131722]'}`}
          >
            {showSma50 ? <Eye size={11} /> : <EyeOff size={11} />}
            SMA 50
          </button>
          <button
            onClick={() => setShowSma200(!showSma200)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${showSma200 ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-sm' : 'bg-white text-[#787b86] border-[#e0e3eb] hover:bg-[#f8f9fa] hover:text-[#131722]'}`}
          >
            {showSma200 ? <Eye size={11} /> : <EyeOff size={11} />}
            SMA 200
          </button>
          <button
            onClick={() => setShowEma50(!showEma50)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${showEma50 ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm' : 'bg-white text-[#787b86] border-[#e0e3eb] hover:bg-[#f8f9fa] hover:text-[#131722]'}`}
          >
            {showEma50 ? <Eye size={11} /> : <EyeOff size={11} />}
            EMA 50
          </button>
        </div>
      </div>

      {/* Dynamic Legend / Tooltip */}
      {hoveredData && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#131722] text-xs font-mono select-none px-3 py-1.5 bg-[#f8f9fa] border border-[#e0e3eb] rounded-xl mb-3 shadow-inner">
          <span className="text-[#787b86] font-bold uppercase tracking-wider text-[10px]">OHLCV:</span>
          <span>Time: <span className="text-[#131722] font-bold">{hoveredData.time}</span></span>
          <span>O: <span className={hoveredData.close >= hoveredData.open ? "text-[#089981] font-bold" : "text-[#f23645] font-bold"}>{hoveredData.open.toFixed(2)}</span></span>
          <span>H: <span className="text-[#131722] font-bold">{hoveredData.high.toFixed(2)}</span></span>
          <span>L: <span className="text-[#131722] font-bold">{hoveredData.low.toFixed(2)}</span></span>
          <span>C: <span className={hoveredData.close >= hoveredData.open ? "text-[#089981] font-bold" : "text-[#f23645] font-bold"}>{hoveredData.close.toFixed(2)}</span></span>
          <span>V: <span className="text-[#2962ff] font-bold">{(hoveredData.volume / 1000000).toFixed(2)}M</span></span>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="flex-1 w-full relative min-h-[300px]">
        <div ref={chartContainerRef} className="w-full h-full relative z-10" />
      </div>
    </div>
  );
}
