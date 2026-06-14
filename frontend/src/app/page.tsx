"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  ShieldAlert, 
  BookOpen, 
  ArrowUpRight, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "How does the AI Stock Analyzer work?",
    answer: "Our stock analyzer retrieves corporate records and key ratios directly from verified sources. Our AI models parse the data to extract management sentiment, financial health, segments, and risks, presenting a simplified context score."
  },
  {
    question: "Where is my trading journal data saved?",
    answer: "Your trading journal is securely stored in a database using Clerk authentication. It remains completely private to you, allowing you to log entries, view P&L calendars, and export prompts for AI coaching."
  },
  {
    question: "Is FinGuard AI a registered financial advisor?",
    answer: "No. FinGuard AI is purely an educational and analytical platform designed to increase financial literacy. We do not provide buy/sell recommendations or manage funds. Always consult a SEBI-registered advisor before investing."
  }
];

const testimonials = [
  {
    name: "Sunita Sharma",
    role: "Retail Investor",
    quote: "The AI Stock Analyzer saves me hours of manual reading. I can immediately see a simplified dashboard of strengths, segment growths, and financial risks for any NIFTY ticker."
  },
  {
    name: "Aditya Verma",
    role: "Part-time Swing Trader",
    quote: "The Zerodha-style P&L calendar in the trading journal is extremely convenient. The AI coach prompts helped me recognize my FOMO entry mistakes."
  },
  {
    name: "Karan Patel",
    role: "Mutual Fund Investor",
    quote: "As a beginner, parsing annual company reports was impossible. The AI Stock Analyzer compiles dry corporate filings into clear strengths, opportunities, and risks."
  }
];

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="bg-background text-foreground min-h-screen font-sans">
      
      {/* Hero Section */}
      <header className="pt-20 pb-16 px-4 max-w-4xl mx-auto text-center space-y-8 select-none">
        <h1 className="text-4xl sm:text-6xl font-normal tracking-tight leading-none font-serif text-foreground">
          Learn Investing. <br />
          Analyze Stocks. <span className="italic text-slate-500 font-sans font-light">Avoid Scams.</span>
        </h1>
        
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-medium">
          Harness artificial intelligence to research Indian stock balance sheets, scan suspicious message tips for market fraud, and audit your trade history with clean analytics.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/stocks" passHref>
            <Button size="lg" className="w-full sm:w-auto bg-[#191919] hover:bg-slate-800 text-white font-bold py-6 px-8 rounded-xl cursor-pointer shadow-sm">
              Analyze a Stock
            </Button>
          </Link>
          <Link href="/trading-journal" passHref>
            <Button size="lg" className="w-full sm:w-auto border border-border bg-white hover:bg-slate-50 text-[#191919] font-bold py-6 px-8 rounded-xl cursor-pointer shadow-sm">
              Trading Journal
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Core Features Section */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="border border-border rounded-xl bg-card p-6 flex flex-col justify-between h-[300px] hover:border-slate-400 transition-all duration-200">
            <div className="space-y-3">
              <div className="text-slate-600 p-2 bg-slate-50 border border-border rounded-lg w-10 h-10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Stock Insights</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Skip downloading endless PDFs. Instantly scrape cash flow files and balance sheets to map out core business segments, future outlooks, and risks.
              </p>
            </div>
            <Link href="/stocks" className="text-xs font-bold text-slate-800 flex items-center gap-1 hover:text-black pt-4">
              Explore stock reports <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="border border-border rounded-xl bg-card p-6 flex flex-col justify-between h-[300px] hover:border-slate-400 transition-all duration-200">
            <div className="space-y-3">
              <div className="text-slate-600 p-2 bg-slate-50 border border-border rounded-lg w-10 h-10 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Scam Scanner</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Scan whatsapp tip groups or telegram advisor posts. Our system validates syntax triggers and warns you of pump-and-dump trap risks.
              </p>
            </div>
            <Link href="/scanner" className="text-xs font-bold text-slate-800 flex items-center gap-1 hover:text-black pt-4">
              Run message scan <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="border border-border rounded-xl bg-card p-6 flex flex-col justify-between h-[300px] hover:border-slate-400 transition-all duration-200">
            <div className="space-y-3">
              <div className="text-slate-600 p-2 bg-slate-50 border border-border rounded-lg w-10 h-10 flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Trade Journal</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Log options and equity logs. View performance in an interactive monthly calendar grid, compile charts, and copy prompts to feed your AI coach.
              </p>
            </div>
            <Link href="/trading-journal" className="text-xs font-bold text-slate-800 flex items-center gap-1 hover:text-black pt-4">
              Open trading journal <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="py-16 px-4 max-w-4xl mx-auto flex flex-col items-center border-t border-border">
        <div className="w-full max-w-[650px] border border-border bg-card rounded-xl p-6 sm:p-10 space-y-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground text-center">Unbiased Analytics Platform</h3>
          
          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-border p-4 rounded-lg select-none">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">Time Required</span>
              <span className="text-sm font-bold text-foreground">10 min / Day</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">Cost</span>
              <span className="text-sm font-bold text-foreground">100% Free</span>
            </div>
          </div>

          <div className="space-y-3 text-xs font-semibold text-muted-foreground pt-2">
            <div className="flex gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-slate-700 flex-shrink-0 mt-0.5" />
              <span>One-Stop Stock Research (combining cash flow and PDF ratios)</span>
            </div>
            <div className="flex gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-slate-700 flex-shrink-0 mt-0.5" />
              <span>Warning indicators for fraudulent Telegram investment groups</span>
            </div>
            <div className="flex gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-slate-700 flex-shrink-0 mt-0.5" />
              <span>Interactive daily trade return heatmaps with copyable AI coaches</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Accordion FAQs */}
      <section className="py-16 px-4 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-border select-none">
        <div className="md:col-span-1 space-y-3">
          <h2 className="text-2xl font-bold text-foreground">FAQs</h2>
          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
            Common questions about our platforms, data sources, and analytical features.
          </p>
        </div>

        <div className="md:col-span-2 divide-y divide-border border border-border bg-card rounded-xl overflow-hidden shadow-sm">
          {faqs.map((faq, index) => {
            const isActive = activeFaq === index;
            return (
              <div key={index} className="p-5 space-y-2">
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between gap-4 text-left font-bold text-foreground hover:text-slate-800 transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isActive ? "rotate-180 text-[#191919]" : ""}`} />
                </button>
                {isActive && (
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
