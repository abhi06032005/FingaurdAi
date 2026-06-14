"use client";

import Link from "next/link";
import { Lock, Sparkles, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JournalRestriction() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden bg-[#07090f]">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full border border-slate-800 bg-slate-950/60 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 space-y-6 text-center">
        
        {/* Glow lock icon */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto">
          <Lock className="w-8 h-8" />
          <div className="absolute -inset-0.5 bg-indigo-500/20 rounded-2xl blur opacity-30 animate-pulse pointer-events-none" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> Paid Feature Required
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Trading Journal
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed font-medium">
            You must be on a Standard or Premium subscription plan to access the Trading Journal.
          </p>
        </div>

        {/* Feature benefits box */}
        <div className="border border-slate-800/80 bg-slate-900/30 rounded-2xl p-4 text-left space-y-3.5">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
            Unlock Paid Capabilities
          </span>
          <ul className="space-y-2.5">
            {[
              "Complete Trading Journal database to log all your trades",
              "Sleek Zerodha-style Profit & Loss interactive calendar",
              "Trade performance analytics and metrics breakdown",
              "Export specialized prompts for your AI Trading Coach"
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 font-semibold leading-relaxed">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link href="/plans" passHref>
            <Button className="w-full py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all">
              Explore Pricing Plans
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/" passHref>
            <Button variant="ghost" className="w-full text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest cursor-pointer">
              Back to Home
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
