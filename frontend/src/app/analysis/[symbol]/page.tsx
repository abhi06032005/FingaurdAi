"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Search, TrendingUp, TrendingDown, Minus,
  Cpu, BarChart2, Activity, Zap, AlertTriangle, RefreshCw
} from "lucide-react";
import PriceChart from "../../../components/chart/PriceChart";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Signal {
  indicator: string;
  value: string;
  signal: string;
  direction: "bullish" | "bearish" | "neutral";
  strength: "weak" | "moderate" | "strong";
}

interface AnalysisData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  priceChange: number;
  priceChangePct: number;
  signals: Signal[];
  divergences: { type: string; strength: string; description: string }[];
  aiSummary: string | null;
  aiGeneratedAt: string | null;
  candlesUsed: number;
  dataQuality: number;
  isCached: boolean;
}

// Helper to determine indicator category
function getIndicatorCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("rsi") || n.includes("macd") || n.includes("stoch")) return "Momentum";
  if (n.includes("sma") || n.includes("ema") || n.includes("adx")) return "Trend";
  if (n.includes("bollinger") || n.includes("atr") || n.includes("volatility")) return "Volatility";
  if (n.includes("obv") || n.includes("volume")) return "Volume";
  return "Technical";
}

// ─── Claude Style Minimal Indicator Card ───────────────────────────────────────

function SentimentMeter({ signal }: { signal: Signal }) {
  const isBull = signal.direction === "bullish";
  const isBear = signal.direction === "bearish";
  
  const directionColor =
    isBull ? "text-emerald-700 bg-emerald-50 border-emerald-100" :
    isBear ? "text-rose-700 bg-rose-50 border-rose-100" :
    "text-slate-600 bg-slate-50 border-slate-100";

  const directionIcon =
    isBull ? <TrendingUp className="w-2.5 h-2.5" /> :
    isBear ? <TrendingDown className="w-2.5 h-2.5" /> :
    <Minus className="w-2.5 h-2.5" />;

  const category = getIndicatorCategory(signal.indicator);

  // Dynamic slider position: Left (Bearish) to Right (Bullish)
  let sliderPos = 50;
  if (isBull) {
    sliderPos = signal.strength === "strong" ? 85 : signal.strength === "moderate" ? 70 : 60;
  } else if (isBear) {
    sliderPos = signal.strength === "strong" ? 15 : signal.strength === "moderate" ? 30 : 40;
  }

  return (
    <div className="bg-white border border-[#e5e2dd] rounded-xl p-5 flex flex-col justify-between h-[150px] relative hover:border-[#191919] transition-all duration-200">
      
      {/* Top Header */}
      <div className="flex items-center justify-between select-none">
        <span className="text-[8px] font-bold uppercase tracking-widest text-[#595959]">
          {category}
        </span>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${directionColor}`}>
          {directionIcon}
          {signal.direction}
        </div>
      </div>

      {/* Title & Value */}
      <div className="space-y-0.5 mt-2">
        <h4 className="text-xs font-bold text-[#191919]">
          {signal.indicator}
        </h4>
        <p className="text-[10px] text-[#595959] font-mono">
          Value: <span className="text-[#191919] font-bold">{signal.value}</span>
        </p>
      </div>

      {/* Flat Visual Slider Bar */}
      <div className="space-y-1 mt-2">
        <div className="relative w-full h-1 bg-[#f0ede9] rounded-full border border-[#e5e2dd]">
          {/* Slider line color range */}
          <div 
            className={`absolute top-0 bottom-0 rounded-full ${
              isBull ? "bg-emerald-500/20" : isBear ? "bg-rose-500/20" : "bg-slate-400/10"
            }`}
            style={{ 
              left: sliderPos >= 50 ? "50%" : `${sliderPos}%`,
              right: sliderPos >= 50 ? `${100 - sliderPos}%` : "50%" 
            }}
          />
          {/* Slider Knob */}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white transition-all duration-300 -ml-1.25 ${
              isBull ? "bg-emerald-600" : isBear ? "bg-rose-600" : "bg-slate-500"
            }`} 
            style={{ left: `${sliderPos}%` }}
          />
        </div>
      </div>

      {/* Message at bottom */}
      <p className="text-[10px] text-[#595959] mt-2.5 leading-tight italic line-clamp-1 select-none">
        "{signal.signal}"
      </p>
    </div>
  );
}

// ─── Claude Style Sentiment Summary ──────────────────────────────────────────

function SentimentSummary({ 
  signals
}: { 
  signals: Signal[]; 
  candlesUsed: number; 
  dataQuality: number; 
}) {
  const bull = signals.filter(s => s.direction === "bullish").length;
  const bear = signals.filter(s => s.direction === "bearish").length;
  const neut = signals.filter(s => s.direction === "neutral").length;
  const total = signals.length || 1;

  const bullPct = Math.round((bull / total) * 100);
  const bearPct = Math.round((bear / total) * 100);
  const neutPct = 100 - bullPct - bearPct;

  const overallSentiment =
    bull > bear + 2 ? "Predominantly Bullish" :
    bear > bull + 2 ? "Predominantly Bearish" :
    bull > bear ? "Slightly Bullish" :
    bear > bull ? "Slightly Bearish" : "Mixed / Neutral";

  const sentimentColor =
    overallSentiment.includes("Bullish") ? "text-emerald-700" :
    overallSentiment.includes("Bearish") ? "text-rose-700" : "text-amber-700";
  
  const sentimentBorder =
    overallSentiment.includes("Bullish") ? "border-emerald-200" :
    overallSentiment.includes("Bearish") ? "border-rose-200" : "border-amber-200";

  return (
    <div className={`bg-white border ${sentimentBorder} rounded-xl p-6 shadow-sm space-y-6 relative overflow-hidden select-none`}>
      <div>
        <p className="text-[10px] text-[#595959] uppercase tracking-widest font-black">Technical Outlook</p>
        <p className={`text-xl font-bold mt-1 leading-none tracking-wide ${sentimentColor}`}>{overallSentiment}</p>
      </div>

      {/* Flat Tri-colour bar */}
      <div className="space-y-2">
        <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 border border-[#e5e2dd] p-[1px]">
          <div className="bg-emerald-500 rounded-l-full" style={{ width: `${bullPct}%` }} />
          <div className="bg-slate-350" style={{ width: `${neutPct}%` }} />
          <div className="bg-rose-500 rounded-r-full" style={{ width: `${bearPct}%` }} />
        </div>
      </div>

      {/* Simple Inline count list */}
      <div className="flex justify-between text-[11px] border-t border-[#e5e2dd] pt-4 text-[#595959] font-medium">
        <span>Bullish: <span className="text-emerald-700 font-bold">{bull}</span></span>
        <span className="border-r border-[#e5e2dd] h-3 my-auto" />
        <span>Neutral: <span className="text-slate-600 font-bold">{neut}</span></span>
        <span className="border-r border-[#e5e2dd] h-3 my-auto" />
        <span>Bearish: <span className="text-rose-700 font-bold">{bear}</span></span>
      </div>
    </div>
  );
}

// ─── Claude Style AI Report Card ──────────────────────────────────────────────

function AIReportCard({ summary }: { summary: string | null; generatedAt: string | null }) {
  const renderText = (text: string) => {
    const lines = text.split("\n").filter(l => l.trim());
    return lines.map((line, i) => {
      const match = line.match(/^\*\*(.*?)\*\*(.*)/);
      if (match) {
        return (
          <div key={i} className="mb-4 last:mb-0">
            <h5 className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              {match[1]}
            </h5>
            <p className="text-xs text-[#191919] leading-relaxed font-medium">
              {match[2].trim().replace(/^—\s*/, "")}
            </p>
          </div>
        );
      }
      return <p key={i} className="text-xs text-[#191919] leading-relaxed mb-3 last:mb-0 font-medium">{line}</p>;
    });
  };

  return (
    <div className="bg-white border border-[#e5e2dd] rounded-xl p-6 shadow-sm relative overflow-hidden group">
      <div className="flex items-center gap-2 mb-4 pb-3.5 border-b border-[#e5e2dd] relative z-10 select-none">
        <Cpu className="text-amber-700 w-4 h-4" />
        <h3 className="text-xs font-bold text-[#191919] tracking-widest uppercase">AI Observation</h3>
      </div>

      <div className="relative z-10">
        {summary ? (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scroll scrollbar-indigo">
            {renderText(summary)}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 py-8 justify-center select-none">
            <div className="relative">
              <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider animate-pulse">Generating Observation...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inner Page Layout ────────────────────────────────────────────────────────

function AnalysisDetailInner({ symbol }: { symbol: string }) {
  const router = useRouter();

  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(symbol.replace(".NS", ""));

  const fetchAnalysis = useCallback(async (sym: string) => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`${API_BASE}/api/stocks/${sym}/technical-analysis`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Failed to fetch analysis");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch analysis once symbol changes
  useEffect(() => {
    fetchAnalysis(symbol);
    setSearch(symbol.replace(".NS", ""));
  }, [symbol, fetchAnalysis]);

  // Poll for AI summary if it's initially null
  useEffect(() => {
    if (!data || data.aiSummary || loading || error) return;

    let active = true;
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stocks/${symbol}/ai-summary`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (json.summary && active) {
          setData(prev => {
            if (!prev) return null;
            return {
              ...prev,
              aiSummary: json.summary,
              aiGeneratedAt: json.generatedAt
            };
          });
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Error polling AI summary:", err);
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [data, symbol, loading, error]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = search.trim().toUpperCase().replace(/\.NS$/, "") + ".NS";
    router.push(`/analysis/${encodeURIComponent(ticker)}`);
  };

  const priceColor = data && data.priceChangePct >= 0 ? "text-emerald-700" : "text-rose-700";
  const priceSign = data && data.priceChangePct >= 0 ? "+" : "";

  // Group signals by category for display order
  const signalOrder = ["RSI", "MACD", "Stoch", "SMA", "EMA", "Bollinger", "ADX", "ATR", "OBV"];
  const sortedSignals = data?.signals.slice().sort((a, b) => {
    const ai = signalOrder.findIndex(k => a.indicator.toLowerCase().includes(k.toLowerCase()));
    const bi = signalOrder.findIndex(k => b.indicator.toLowerCase().includes(k.toLowerCase()));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  }) ?? [];

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#191919] pb-20 relative overflow-hidden font-sans">
      
      {/* Sticky search header */}
      <div className="sticky top-0 z-40 border-b border-[#e5e2dd] bg-[#faf9f6]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/analysis"
            className="p-2 text-slate-500 hover:text-[#191919] transition-all duration-150 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </Link>

          {/* Claude style inline search box */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
            <div className="relative flex-1 flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stock..."
                className="w-full bg-white border border-[#e5e2dd] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#191919] placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all duration-200"
              />
            </div>
          </form>

          {/* Ticker / Price info */}
          <div className="ml-auto flex items-center gap-5 select-none">
            <div className="text-right">
              <p className="text-sm font-bold text-[#191919] leading-none tracking-wide">{symbol.replace(".NS", "")}</p>
              <p className="text-[9.5px] text-slate-500 mt-1 truncate max-w-[120px] font-medium">{data?.companyName || "NIFTY 50"}</p>
            </div>
            {data && (
              <div className="text-right">
                <p className="text-base font-bold font-mono text-[#191919] leading-none">
                  ₹{data.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-[11px] font-bold font-mono mt-1 ${priceColor}`}>
                  {priceSign}{data.priceChangePct.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">

        {/* Error State */}
        {error && !loading && (
          <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-white border border-[#e5e2dd] rounded-xl p-8 shadow-sm select-none">
            <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="text-sm font-bold text-[#191919] uppercase tracking-wider">Analysis Execution Failed</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{error}</p>
            <button
              onClick={() => fetchAnalysis(symbol)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#191919] text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Success State */}
        {!error && (
          <div className="space-y-6">
            
            {/* Divergence alerts */}
            {data && data.divergences.length > 0 && (
              <div className="space-y-2 select-none">
                {data.divergences.map((d, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-3 px-4 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-amber-900"
                  >
                    <Zap className="w-3.5 h-3.5 flex-shrink-0 text-amber-700" />
                    <span className="leading-relaxed">
                      <strong className="font-bold text-amber-800 mr-1 uppercase tracking-wide">
                        {d.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </strong> 
                      — {d.description}
                    </span>
                    <span className="ml-auto font-black uppercase tracking-widest text-[8px] px-2 py-0.5 rounded bg-amber-100/50 border border-amber-200/50 text-amber-800">
                      {d.strength}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Dashboard grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Column: AI Observation & Price Chart */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* AI Summary Observation Card */}
                <AIReportCard summary={data?.aiSummary ?? null} generatedAt={data?.aiGeneratedAt ?? null} />

                {/* Price Chart Container */}
                <PriceChart symbol={symbol} />

              </div>

              {/* Right Column: Sentiment Outlook */}
              <div className="space-y-6">
                {data ? (
                  <SentimentSummary 
                    signals={data.signals} 
                    candlesUsed={data.candlesUsed} 
                    dataQuality={data.dataQuality} 
                  />
                ) : (
                  <div className="bg-white border border-[#e5e2dd] rounded-xl p-6 h-[160px] flex flex-col items-center justify-center gap-2 select-none">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Grid: Detailed Signals */}
            <div className="space-y-4 pt-6 border-t border-[#e5e2dd]">
              <div className="flex items-center gap-2 select-none">
                <BarChart2 className="w-3.5 h-3.5 text-[#191919]" />
                <h2 className="text-xs font-bold text-[#191919] tracking-widest uppercase">Detailed Signals</h2>
              </div>
              
              {data ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortedSignals.map((s, i) => (
                    <SentimentMeter key={i} signal={s} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-white border border-[#e5e2dd] rounded-xl h-[150px] animate-pulse flex flex-col justify-between p-5">
                      <div className="flex justify-between items-center">
                        <div className="h-3 w-12 bg-slate-100 rounded" />
                        <div className="h-3 w-8 bg-slate-100 rounded-full" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-3.5 w-16 bg-slate-100 rounded" />
                        <div className="h-3 w-14 bg-slate-100 rounded" />
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full" />
                      <div className="h-3 w-20 bg-slate-100 rounded" />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.08); border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.18); }
      `}</style>
    </div>
  );
}

export default function AnalysisDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params);
  const resolvedSymbol = decodeURIComponent(resolvedParams.symbol).toUpperCase();

  return <AnalysisDetailInner symbol={resolvedSymbol} />;
}
