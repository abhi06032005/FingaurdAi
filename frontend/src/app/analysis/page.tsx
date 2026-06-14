"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, AlertCircle, BarChart2 } from "lucide-react";

const SUGGESTIONS = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "WIPRO", "TITAN"];

const NIFTY_50 = [
  "RELIANCE","TCS","HDFCBANK","ICICIBANK","INFY","HINDUNILVR","ITC","SBIN",
  "BHARTIARTL","KOTAKBANK","LT","AXISBANK","ASIANPAINT","MARUTI","BAJFINANCE",
  "HCLTECH","SUNPHARMA","TITAN","WIPRO","ULTRACEMCO","ONGC","POWERGRID","NTPC",
  "TECHM","M&M","JSWSTEEL","TATASTEEL","INDUSINDBK","BAJAJFINSV","COALINDIA",
  "NESTLEIND","BPCL","ADANIENT","ADANIPORTS","DRREDDY","GRASIM","CIPLA",
  "HINDALCO","DIVISLAB","EICHERMOT","BRITANNIA","APOLLOHOSP","BAJAJ-AUTO",
  "TATACONSUM","HEROMOTOCO","SBILIFE","HDFCLIFE","LTIM","UPL","BEL"
];

export default function AnalysisPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const handleSearch = (tickerName?: string) => {
    const ticker = (tickerName ?? search).trim().toUpperCase().replace(/\.NS$/, "");
    if (!ticker) return;

    if (!NIFTY_50.includes(ticker)) {
      setError(`"${ticker}" is not in the NIFTY 50 index.`);
      return;
    }

    setError("");
    router.push(`/analysis/${encodeURIComponent(ticker + ".NS")}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#191919] flex flex-col justify-center items-center font-sans px-4 select-none">
      
      {/* Main Container */}
      <div className="max-w-xl w-full space-y-8 py-12">
        
        {/* Logo / Brand Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-normal tracking-tight text-[#191919] font-serif">
            FinGuard <span className="font-sans font-light text-slate-400">AI</span>
          </h1>
          <p className="text-xs text-slate-500 tracking-wide font-medium">
            Technical Analysis Engine
          </p>
        </div>

        {/* ChatGPT / Claude Style Centered Search Bar */}
        <form onSubmit={onSubmit} className="relative w-full shadow-sm">
          <div className="relative flex items-center bg-white border border-[#e5e2dd] rounded-2xl p-1.5 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-200 transition-all duration-200">
            <Search className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setError(""); }}
              placeholder="What NIFTY 50 stock would you like to analyze?"
              className="w-full bg-transparent border-0 outline-none px-3 py-2.5 text-sm text-[#191919] placeholder-slate-450 focus:ring-0 focus:outline-none"
            />
            <button
              type="submit"
              className="p-2.5 bg-[#191919] text-white hover:bg-slate-800 rounded-xl transition-all duration-150 cursor-pointer flex-shrink-0"
              aria-label="Analyze"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-1.5 justify-center text-rose-600 text-xs font-medium animate-in fade-in duration-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Suggestion Quick Picks */}
        <div className="space-y-3 text-center">
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-widest select-none">Popular Suggestions</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {SUGGESTIONS.map((t) => (
              <button
                key={t}
                onClick={() => handleSearch(t)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#595959] bg-white border border-[#e5e2dd] rounded-full hover:border-[#191919] hover:text-[#191919] active:scale-95 transition-all duration-150 cursor-pointer"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
