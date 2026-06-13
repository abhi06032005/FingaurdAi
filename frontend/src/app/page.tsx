"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  ShieldAlert, 
  BookOpen, 
  ArrowUpRight, 
  CheckCircle2, 
  ChevronDown, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Clock,
  PiggyBank,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// FAQs Data Structure
const faqs = [
  {
    question: "How does the AI Stock Analyzer work?",
    answer: "Our stock analyzer retrieves corporate records, balance sheets, and key ratios directly from verified sources like Screener.in and NSE India. Our AI models parse the data to extract management sentiment, financial health, segments, and risks, presenting a simplified 10-point context score."
  },
  {
    question: "Where is my trading journal data saved?",
    answer: "Your trading journal is securely stored in a Neon PostgreSQL database using Clerk authentication. It remains completely private to you, allowing you to log entries, view Zerodha-style profit calendars, and export prompts for AI-driven coaching."
  },
  {
    question: "Is FinGuard AI a registered financial advisor?",
    answer: "No. FinGuard AI is purely an educational and analytical platform designed to increase financial literacy. We do not provide direct buy/sell recommendations or manage funds. Always consult a SEBI-registered advisor before investing."
  }
];

// Testimonials Data Structure
const testimonials = [
  {
    name: "Sunita Sharma",
    role: "Retail Investor",
    experience: "3+ years investing",
    quote: "The AI Stock Analyzer saves me hours of manual reading. I can immediately see a simplified dashboard of strengths, segment growths, and financial risks for any NSE ticker.",
    avatarBg: "bg-teal-500/10 text-teal-400"
  },
  {
    name: "Aditya Verma",
    role: "Part-time Swing Trader",
    experience: "2+ years trading",
    quote: "The Zerodha-style P&L calendar in the trading journal is extremely convenient. But what's truly mind-blowing is the AI coach prompt export; it helped me recognize my FOMO entry mistakes.",
    avatarBg: "bg-cyan-500/10 text-cyan-400"
  },
  {
    name: "Karan Patel",
    role: "Mutual Fund Investor",
    experience: "Beginner",
    quote: "As a beginner, parsing annual company reports was impossible. The AI Stock Analyzer compiles dry corporate filings into clear strengths, opportunities, and risks that I can actually understand.",
    avatarBg: "bg-amber-500/10 text-amber-400"
  }
];

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleNextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="home-page-bg text-foreground min-h-screen overflow-x-hidden font-sans selection:bg-primary/30 selection:text-white">
      
      {/* Glow Backdrop Overlays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-200px] left-[15%] w-[35%] h-[350px] bg-cyan-600/15 rounded-full blur-[120px] md:blur-[180px]"></div>
        <div className="absolute top-[-100px] right-[15%] w-[35%] h-[350px] bg-emerald-600/15 rounded-full blur-[120px] md:blur-[180px]"></div>
      </div>

      {/* Hero Section */}
      <header className="relative z-10 pt-24 pb-16 md:pt-36 md:pb-24 px-4 max-w-5xl mx-auto text-center space-y-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          FinGuard AI v2.0
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-none max-w-4xl mx-auto">
          Learn Investing. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
            Analyze Stocks.
          </span> Avoid Scams.
        </h1>
        
        <p className="text-gray-400 text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl mx-auto font-medium">
          Harness institutional-grade Artificial Intelligence to research Indian stock balance sheets, scan suspicious WhatsApp tips for market fraud, and audit your trade history with interactive P&L analytics.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/stocks" passHref>
            <Button size="lg" className="w-full sm:w-auto bg-white hover:bg-gray-200 text-black font-bold py-6 px-8 rounded-full shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer">
              Analyze a Stock
            </Button>
          </Link>
          <Link href="/trading-journal" passHref>
            <Button size="lg" className="w-full sm:w-auto border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold py-6 px-8 rounded-full shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer">
              Trading Journal <ArrowUpRight className="h-4.5 w-4.5" />
            </Button>
          </Link>
        </div>

        {/* Hero Interactive Preview Card */}
        <div className="relative mt-20 pt-10">
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[60%] h-[300px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 rounded-full blur-[140px] opacity-20 pointer-events-none z-0"></div>
          
          <div className="relative z-10 border border-white/10 rounded-2xl bg-slate-950/60 backdrop-blur-md shadow-2xl p-6 md:p-8 max-w-4xl mx-auto">
            {/* Mock Dashboard Top Interface Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500/80"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-green-500/80"></div>
              </div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest bg-white/5 px-2.5 py-1 rounded-md">
                Unbiased Platform Dashboard
              </span>
            </div>

            {/* Dashboard Simulated Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="border border-white/5 bg-white/5 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                  <h3 className="font-bold text-white text-sm">Fundamental Analyzer</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Decodes cash flows, P/E metrics, business segments, and debt ratios of NSE companies instantly.
                </p>
              </div>

              <div className="border border-white/5 bg-white/5 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-red-400">
                  <ShieldAlert className="h-5 w-5" />
                  <h3 className="font-bold text-white text-sm">Message Scam Scanner</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Upload WhatsApp forwards or Telegram alerts to identify fake advisor pump schemes with Risk Rating.
                </p>
              </div>

              <div className="border border-white/5 bg-white/5 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-cyan-400">
                  <BookOpen className="h-5 w-5" />
                  <h3 className="font-bold text-white text-sm">Trade Calendar Audit</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  A dynamic, color-coded daily return log calendar mapping strategy metrics and AI coaching prompts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Value Proposition Intro Segment */}
      <section className="relative py-20 px-4 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">Core Technology</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            AI-Driven Investment <br />
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
              Security & Research
            </span>
          </h2>
          <div className="space-y-4 text-gray-400 font-medium">
            <p>
              Retail investors lose crores daily to unverified market tips, financial frauds, and raw emotional trading biases. FinGuard AI was developed to offer institutional-grade protection.
            </p>
            <p>
              By combining quantitative balance sheet scrapers, natural language scam scanners, and mathematical P&L calendars, we help you trade with discipline.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/scanner" passHref>
              <Button size="lg" className="rounded-full bg-white hover:bg-gray-200 text-black font-semibold px-8 cursor-pointer">
                Scan suspicious message
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Visual Mockup Card */}
        <div className="relative border border-white/10 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl flex flex-col justify-between aspect-[4/3]">
          <div className="absolute top-[20%] right-[20%] w-[50%] h-[150px] bg-cyan-500 rounded-full blur-[80px] opacity-15 pointer-events-none"></div>
          
          <div className="flex justify-between items-center">
            <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs px-2.5">
              Verified Stock Analysis
            </Badge>
            <span className="text-xs text-gray-500 font-bold">NSE: TCS</span>
          </div>

          <div className="space-y-3 py-6">
            <div className="text-3xl font-extrabold text-white">9.2 / 10</div>
            <div className="text-xs text-gray-400">FinGuard Context Confidence Score</div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 h-full rounded-full" style={{ width: "92%" }}></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400 border-t border-white/5 pt-4">
            <div>
              <span className="block text-gray-500 mb-0.5">ROCE</span>
              <span className="font-bold text-white">46.2%</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-0.5">PE Ratio</span>
              <span className="font-bold text-white">28.4</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-0.5">Debt / Equity</span>
              <span className="font-bold text-green-400">0.05</span>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Features Segment */}
      <section className="py-20 px-4 max-w-5xl mx-auto space-y-12 text-center">
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Features & Benefits</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            Equip your trading arsenal with three dynamic utilities built to simplify research and limit risk.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          
          {/* Card 1 */}
          <div className="border border-white/10 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 flex flex-col justify-between h-[360px] group hover:border-emerald-500/30 transition-all duration-300">
            <div className="space-y-4">
              <div className="bg-emerald-600/10 text-emerald-400 p-3 rounded-xl w-12 h-12 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Automated Stock Insights</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Skip downloading endless PDFs. Instantly scrape cash flow files and balance sheets to map out core business segments, future outlooks, and risks.
              </p>
            </div>
            <Link href="/stocks" className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:text-emerald-300 transition-colors pt-4">
              Explore stock reports <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="border border-white/10 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 flex flex-col justify-between h-[360px] group hover:border-red-500/30 transition-all duration-300">
            <div className="space-y-4">
              <div className="bg-red-600/10 text-red-400 p-3 rounded-xl w-12 h-12 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Zero-Trust Scam Scanner</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Scan whatsapp tip groups or suspicious telegram advisor posts. Our system validates syntax triggers and warns you of pump-and-dump trap risks.
              </p>
            </div>
            <Link href="/scanner" className="text-xs font-semibold text-red-400 flex items-center gap-1 group-hover:text-red-300 transition-colors pt-4">
              Run message scan <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="border border-white/10 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 flex flex-col justify-between h-[360px] group hover:border-cyan-500/30 transition-all duration-300">
            <div className="space-y-4">
              <div className="bg-cyan-600/10 text-cyan-400 p-3 rounded-xl w-12 h-12 flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Interactive P&L Calendar</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Log options and equity logs. View performance in an interactive monthly calendar grid, compile charts, and copy prompts to feed your AI coach.
              </p>
            </div>
            <Link href="/trading-journal" className="text-xs font-semibold text-cyan-400 flex items-center gap-1 group-hover:text-cyan-300 transition-colors pt-4">
              Open trading journal <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Stat Segment */}
      <section className="py-20 px-4 max-w-5xl mx-auto flex flex-col items-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white text-center mb-16 max-w-3xl">
          Using FinGuard AI saves <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent">6+ hours</span> per day and prevents costly scam losses
        </h2>

        <div className="w-full max-w-[650px] rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 p-[1px]">
          <div className="w-full rounded-2xl bg-[#0a0a0c] p-6 sm:p-12 space-y-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-emerald-600/15 flex items-center justify-center flex-shrink-0 text-emerald-400">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  Unbiased Analysis <br />
                  with FinGuard AI
                </h3>
              </div>
            </div>

            {/* Quick Metrics Comparison Grid */}
            <div className="grid grid-cols-2 gap-4 bg-[#111115] p-5 rounded-xl border border-white/5">
              <div className="space-y-1">
                <span className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Time Requirement
                </span>
                <span className="text-base sm:text-lg font-extrabold text-white">10 min / Day</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                  <PiggyBank className="h-3.5 w-3.5" /> Advisor Cost
                </span>
                <span className="text-base sm:text-lg font-extrabold text-white">100% Free</span>
              </div>
            </div>

            {/* Feature List checklist */}
            <div className="space-y-4 text-sm font-semibold">
              <div className="flex gap-3 text-gray-400">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>One-Stop Stock Research (combining cash flow and PDF ratios)</span>
              </div>
              <div className="flex gap-3 text-gray-400">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>Instant warning levels for fraudulent Telegram investment groups</span>
              </div>
              <div className="flex gap-3 text-gray-400">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>Interactive daily trade return heatmaps with copyable AI coaches</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <Link href="/stocks" passHref>
                <Button size="lg" className="w-full bg-white hover:bg-gray-200 text-black font-bold py-6 rounded-full cursor-pointer">
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Segment */}
      <section className="py-20 px-4 max-w-5xl mx-auto space-y-16">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white text-center">
          Beta Testers Feedback
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Left Testimonial Card */}
          <div className="border border-white/10 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-8 space-y-6 min-h-[300px] flex flex-col justify-between relative">
            <div className="space-y-4">
              {/* Stars rendering */}
              <div className="flex gap-1 text-yellow-500">
                {"★".repeat(5)}
              </div>
              <p className="text-lg sm:text-xl font-medium text-white italic leading-relaxed">
                "{testimonials[currentTestimonial].quote}"
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${testimonials[currentTestimonial].avatarBg}`}>
                  {testimonials[currentTestimonial].name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{testimonials[currentTestimonial].name}</h4>
                  <span className="text-xs text-gray-500 font-semibold">{testimonials[currentTestimonial].role} ({testimonials[currentTestimonial].experience})</span>
                </div>
              </div>

              {/* Slider controls */}
              <div className="flex gap-2">
                <Button variant="outline" size="icon-xs" onClick={handlePrevTestimonial} className="h-8 w-8 hover:bg-white/10 rounded-full cursor-pointer">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon-xs" onClick={handleNextTestimonial} className="h-8 w-8 hover:bg-white/10 rounded-full cursor-pointer">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right graphics preview */}
          <div className="hidden md:flex justify-center items-center">
            <div className="relative p-6 border border-white/10 bg-slate-950/40 rounded-2xl max-w-sm w-full space-y-4">
              <div className="absolute top-[20%] left-[20%] w-[60%] h-[120px] bg-emerald-600 rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                Real-Time Scam Alert
              </h4>
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 space-y-2 text-xs leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-red-500">
                  <ShieldAlert className="h-4 w-4" /> High Risk Detected (90% rating)
                </div>
                <p>
                  \"Guaranteed returns of 5% daily. Send money directly to register...\"
                </p>
                <span className="text-[10px] text-gray-500 font-medium block pt-1">Red flag: Guaranteed high yields, pressure tactics.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Segment */}
      <section className="py-20 px-4 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/5">
        <div className="md:col-span-1 space-y-4">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">Support</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">FAQs</h2>
          <p className="text-sm text-gray-500 leading-relaxed font-semibold">
            Common questions about our platforms, data sources, and analytical features.
          </p>
        </div>

        <div className="md:col-span-2 divide-y divide-white/5 border border-white/10 bg-[#0a0a0c] rounded-2xl overflow-hidden shadow-md">
          {faqs.map((faq, index) => {
            const isActive = activeFaq === index;
            return (
              <div key={index} className="p-5 space-y-3">
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between gap-4 text-left font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isActive ? "rotate-180 text-emerald-400" : ""}`} />
                </button>
                {isActive && (
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed pt-1">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Join Newsletter Section */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600/10 via-cyan-600/10 to-amber-600/10 border border-emerald-500/20 p-8 md:p-16 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-[20%] left-[30%] w-[40%] h-[150px] bg-emerald-600 rounded-full blur-[120px] opacity-15 pointer-events-none"></div>
          
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Ready to secure your capital?
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Join thousands of smart investors analyzing stock balance sheets, scan message tips for fraud, and logging trade performances safely.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link href="/register" passHref className="w-full">
              <Button size="lg" className="w-full bg-white hover:bg-gray-200 text-black font-bold py-5 rounded-full cursor-pointer shadow-lg">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
