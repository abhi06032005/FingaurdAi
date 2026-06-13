"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Loader2, AlertTriangle, TrendingUp, TrendingDown,
  Shield, BarChart3, Building2, Leaf, Target, Eye,
  ChevronRight, Minus, Star, AlertCircle, CheckCircle2,
  Activity, Zap, Globe2, Brain
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

import { useUserDb } from "@/context/UserContext";


// ─── Types ────────────────────────────────────────────────────────────────────

interface AIReport {
  ticker: string;
  company_name: string;
  generated_at: string;
  data_sources: {
    stock_data_available: boolean;
    annual_reports_count: number;
    fiscal_years_covered: string[];
  };
  executive_summary: {
    company_overview: string;
    one_liner: string;
    investment_thesis: string;
  };
  financial_snapshot: {
    revenue_trend: string;
    profit_trend: string;
    margin_analysis: string;
    balance_sheet_health: string;
    cash_flow_summary: string;
    key_ratios: Array<{ name: string; value: string; benchmark: string; interpretation: string }>;
    quarterly_highlights: string;
  };
  bull_bear_analysis: {
    bull_case: Array<{ point: string; evidence: string; strength: "strong" | "moderate" | "speculative" }>;
    bear_case: Array<{ point: string; evidence: string; severity: "high" | "medium" | "low" }>;
    verdict: string;
  };
  business_quality_score: {
    revenue_visibility: number;
    management_quality: number;
    competitive_moat: number;
    balance_sheet_strength: number;
    earnings_quality: number;
    esg_practices: number;
    overall_score: number;
    score_rationale: string;
  };
  risk_matrix: {
    risks: Array<{ name: string; category: string; probability: string; impact: string; mitigation: string }>;
    overall_risk_level: "high" | "medium" | "low";
  };
  strategic_outlook: {
    management_guidance: string;
    capex_plans: string;
    growth_catalysts: string[];
    near_term_monitorables: string[];
    long_term_vision: string;
  };
  industry_context: {
    sector: string;
    market_position: string;
    peer_comparison: string;
    industry_tailwinds: string[];
    industry_headwinds: string[];
    competitive_landscape: string;
  };
  esg_summary: {
    environmental: string;
    social: string;
    governance: string;
    csr_initiatives: string;
    esg_rating_notes: string;
  };
  key_monitorables: string[];
  disclaimer: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  const color = value >= 7 ? "#22c55e" : value >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="font-extrabold" style={{ color }}>{value}/10</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    high:   { bg: "bg-red-500/10 border-red-500/30",    text: "text-red-400",    label: "HIGH" },
    medium: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400",  label: "MED" },
    low:    { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", label: "LOW" },
  };
  const c = cfg[level?.toLowerCase()] || cfg.low;
  return (
    <span className={`text-xs font-extrabold px-3 py-1 rounded-xl border ${c.bg} ${c.text} tracking-wider`}>
      {c.label}
    </span>
  );
}

function StrengthDot({ s }: { s: string }) {
  if (s === "strong") return <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(16,185,129,0.5)]" />;
  if (s === "moderate") return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-[0_0_6px_rgba(245,158,11,0.5)]" />;
  return <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />;
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-800/80">
      <span className="text-indigo-400 w-5 h-5 flex items-center justify-center">{icon}</span>
      <h3 className="text-base font-extrabold text-white tracking-wider uppercase">{title}</h3>
    </div>
  );
}

function InfoCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 md:p-8 transition-all hover:border-slate-700/50 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

// ─── Main AI Report Renderer ──────────────────────────────────────────────────

// Render helper to parse bold text **like this**
function renderBoldText(str: string) {
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="text-white font-extrabold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function FormattedText({ text, className = "" }: { text?: string; className?: string }) {
  if (!text) return <p className="text-slate-400 text-sm italic">No commentary available.</p>;
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return (
    <div className={`space-y-3.5 ${className}`}>
      {lines.map((line, idx) => {
        // Check for bullet indicators
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          const content = line.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex gap-2.5 text-sm text-slate-300 pl-1">
              <span className="text-indigo-500 mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="leading-relaxed">{renderBoldText(content)}</span>
            </div>
          );
        }
        
        // Check for numbered list indicators
        const numMatch = line.match(/^(\d+)\.\s*(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex gap-2.5 text-sm text-slate-300 pl-1">
              <span className="text-indigo-400 font-bold leading-relaxed">{numMatch[1]}.</span>
              <span className="leading-relaxed">{renderBoldText(numMatch[2])}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-sm text-slate-300 leading-relaxed">
            {renderBoldText(line)}
          </p>
        );
      })}
    </div>
  );
}

// ─── Chart Data Parsers ──────────────────────────────────────────────────────

interface FinancialDataPoint {
  year: string;
  sales: number;
  profit: number;
}

function parseAnnualFinancials(stockData: any): FinancialDataPoint[] {
  if (!stockData) return [];
  const pnl = stockData.profit_and_loss;
  let rows: any[] = [];
  if (Array.isArray(pnl)) {
    rows = pnl;
  } else if (pnl && Array.isArray(pnl.annual_data)) {
    rows = pnl.annual_data;
  }
  
  if (rows.length === 0) return [];
  
  const salesRow = rows.find((r: any) => r.Metric === "Sales");
  const profitRow = rows.find((r: any) => r.Metric === "Net Profit");
  if (!salesRow) return [];
  
  const years = Object.keys(salesRow).filter(
    (k) => k !== "Metric" && k !== "_id" && k !== "id" && k !== "__v"
  );
  
  return years.map((yr) => {
    const sVal = parseFloat(String(salesRow[yr] ?? 0).replace(/,/g, ""));
    const pVal = profitRow ? parseFloat(String(profitRow[yr] ?? 0).replace(/,/g, "")) : 0;
    return {
      year: yr,
      sales: isNaN(sVal) ? 0 : sVal,
      profit: isNaN(pVal) ? 0 : pVal,
    };
  }).filter(d => d.sales > 0);
}

function parseLatestShareholding(stockData: any) {
  if (!stockData || !stockData.shareholding || !Array.isArray(stockData.shareholding.quarterly)) {
    return [];
  }
  const quarterly = stockData.shareholding.quarterly;
  if (quarterly.length === 0) return [];

  const firstRow = quarterly[0];
  const labelKey = Object.keys(firstRow).find(k => k === '' || k === 'Metric') || '';
  const allPeriods = Object.keys(firstRow).filter((k) => k !== labelKey && k !== 'Metric' && k !== '__v');
  if (allPeriods.length === 0) return [];

  const latestPeriod = allPeriods[allPeriods.length - 1];

  return quarterly.map((row: any) => {
    const name = (row[labelKey] || '').replace(/ \+$/, '').trim();
    if (!name || name.toLowerCase().includes('shareholders')) return null;
    const value = parseFloat(String(row[latestPeriod] ?? 0).replace(/%/g, ''));
    return {
      category: name,
      value: isNaN(value) ? 0 : value,
    };
  }).filter(Boolean) as Array<{ category: string; value: number }>;
}

function parseQuarterlyFinancials(stockData: any) {
  if (!stockData || !Array.isArray(stockData.quarters)) return [];
  const quarters = stockData.quarters;
  if (quarters.length === 0) return [];

  const salesRow = quarters.find((r: any) => r.Metric === "Sales");
  const profitRow = quarters.find((r: any) => r.Metric === "Net Profit");
  if (!salesRow) return [];

  const periods = Object.keys(salesRow).filter(
    (k) => k !== "Metric" && k !== "_id" && k !== "id" && k !== "__v"
  );

  const last6Periods = periods.slice(-6);

  return last6Periods.map((p) => {
    const sVal = parseFloat(String(salesRow[p] ?? 0).replace(/,/g, ""));
    const pVal = profitRow ? parseFloat(String(profitRow[p] ?? 0).replace(/,/g, "")) : 0;
    return {
      quarter: p,
      sales: isNaN(sVal) ? 0 : sVal,
      profit: isNaN(pVal) ? 0 : pVal,
    };
  });
}

function parseCompoundedRates(stockData: any) {
  if (!stockData || !stockData.profit_and_loss) return null;
  const pnl = stockData.profit_and_loss;

  const parseArray = (arr: any) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => {
      const entries = Object.entries(item);
      if (entries.length === 0) return null;
      const [period, val] = entries[0];
      return {
        period: period.trim(),
        value: String(val).replace(/%/g, "").trim(),
      };
    }).filter(Boolean) as Array<{ period: string; value: string }>;
  };

  return {
    sales: parseArray(pnl['Compounded Sales Growth']),
    profit: parseArray(pnl['Compounded Profit Growth']),
    stock: parseArray(pnl['Stock Price CAGR']),
    roe: parseArray(pnl['Return on Equity']),
  };
}

// ─── SVG Math Helper ──────────────────────────────────────────────────────────

function getDonutSlicePath(
  cx: number, cy: number,
  innerRadius: number, outerRadius: number,
  startAngleDegrees: number, endAngleDegrees: number
) {
  const startAngleRad = (startAngleDegrees - 90) * Math.PI / 180.0;
  const endAngleRad = (endAngleDegrees - 90) * Math.PI / 180.0;

  const x1Outer = cx + outerRadius * Math.cos(startAngleRad);
  const y1Outer = cy + outerRadius * Math.sin(startAngleRad);
  const x2Outer = cx + outerRadius * Math.cos(endAngleRad);
  const y2Outer = cy + outerRadius * Math.sin(endAngleRad);

  const x1Inner = cx + innerRadius * Math.cos(startAngleRad);
  const y1Inner = cy + innerRadius * Math.sin(startAngleRad);
  const x2Inner = cx + innerRadius * Math.cos(endAngleRad);
  const y2Inner = cy + innerRadius * Math.sin(endAngleRad);

  const largeArcFlag = endAngleDegrees - startAngleDegrees <= 180 ? "0" : "1";

  return [
    `M ${x1Outer} ${y1Outer}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
    `L ${x2Inner} ${y2Inner}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1Inner} ${y1Inner}`,
    "Z"
  ].join(" ");
}

// ─── Interactive SVG Chart Components ────────────────────────────────────────

function InteractiveFinancialChart({ stockData }: { stockData: any }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!stockData) return null;

  const data = parseAnnualFinancials(stockData);
  if (data.length === 0) return null;

  const maxSales = Math.max(...data.map(d => d.sales));
  const maxProfit = Math.max(...data.map(d => d.profit));
  const maxVal = Math.max(maxSales, maxProfit * 1.2, 1);

  const width = 600;
  const height = 280;
  const padding = { top: 30, right: 20, bottom: 45, left: 75 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const gridTicks = 5;
  const gridLines = Array.from({ length: gridTicks }).map((_, i) => {
    const yVal = maxVal * (i / (gridTicks - 1));
    const yPos = padding.top + chartHeight - (yVal / maxVal) * chartHeight;
    return { yPos, label: formatCr(yVal) };
  });

  function formatCr(val: number) {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L Cr`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k Cr`;
    return `₹${val.toFixed(0)} Cr`;
  }

  return (
    <div className="relative bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 w-full shadow-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <div>
          <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-indigo-400" /> Revenue & Profit Trend (Annual)
          </h4>
          <p className="text-xs text-slate-500 mt-1">Hover over bars to view detailed numbers and margins</p>
        </div>
        <div className="flex gap-4 text-xs uppercase font-bold tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            <span className="text-slate-300">Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-slate-300">Net Profit</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={line.yPos}
                x2={width - padding.right}
                y2={line.yPos}
                stroke="#1e293b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 12}
                y={line.yPos + 4}
                fill="#64748b"
                fontSize="10"
                fontWeight="bold"
                textAnchor="end"
                className="tabular-nums"
              >
                {line.label}
              </text>
            </g>
          ))}

          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="#334155"
            strokeWidth="2"
          />

          {data.map((d, idx) => {
            const groupWidth = chartWidth / data.length;
            const xGroupStart = padding.left + idx * groupWidth;
            const barWidth = Math.min(18, groupWidth * 0.35);
            const gap = 4;

            const xSales = xGroupStart + (groupWidth - barWidth * 2 - gap) / 2;
            const xProfit = xSales + barWidth + gap;

            const hSales = (d.sales / maxVal) * chartHeight;
            const hProfit = (d.profit / maxVal) * chartHeight;

            const ySales = padding.top + chartHeight - hSales;
            const yProfit = padding.top + chartHeight - hProfit;

            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                <rect
                  x={xGroupStart + 2}
                  y={padding.top - 5}
                  width={groupWidth - 4}
                  height={chartHeight + 10}
                  fill={isHovered ? "rgba(99, 102, 241, 0.04)" : "transparent"}
                  rx="8"
                  className="transition-all duration-300"
                />

                {/* Sales Bar */}
                <rect
                  x={xSales}
                  y={ySales}
                  width={barWidth}
                  height={Math.max(2, hSales)}
                  fill="url(#salesGrad)"
                  rx="4"
                  className="transition-all duration-300"
                  opacity={hoveredIndex !== null && !isHovered ? 0.4 : 1}
                  filter={isHovered ? "url(#glowSales)" : ""}
                />

                {/* Profit Bar */}
                <rect
                  x={xProfit}
                  y={yProfit}
                  width={barWidth}
                  height={Math.max(2, hProfit)}
                  fill="url(#profitGrad)"
                  rx="4"
                  className="transition-all duration-300"
                  opacity={hoveredIndex !== null && !isHovered ? 0.4 : 1}
                  filter={isHovered ? "url(#glowProfit)" : ""}
                />

                <text
                  x={xGroupStart + groupWidth / 2}
                  y={padding.top + chartHeight + 20}
                  fill={isHovered ? "#ffffff" : "#94a3b8"}
                  fontSize="10"
                  fontWeight={isHovered ? "bold" : "semibold"}
                  textAnchor="middle"
                  className="transition-all duration-300"
                >
                  {d.year}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="glowSales" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowProfit" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>

        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute z-10 bg-slate-950/95 border border-indigo-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-md pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95"
            style={{
              left: `${Math.min(
                width - 210,
                Math.max(
                  10,
                  padding.left + hoveredIndex * (chartWidth / data.length) + (chartWidth / data.length) / 2 - 105
                )
              )}px`,
              top: `${padding.top - 10}px`,
            }}
          >
            <p className="text-xs font-black text-slate-400 border-b border-slate-800 pb-1.5 mb-2 flex justify-between items-center uppercase tracking-widest">
              <span>{data[hoveredIndex].year}</span>
              <span className="text-indigo-400 font-bold">Annual</span>
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-6">
                <span className="text-slate-400 font-medium">Revenue:</span>
                <span className="text-white font-bold tabular-nums">₹{data[hoveredIndex].sales.toLocaleString("en-IN")} Cr</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-slate-400 font-medium">Net Profit:</span>
                <span className="text-emerald-400 font-bold tabular-nums">₹{data[hoveredIndex].profit.toLocaleString("en-IN")} Cr</span>
              </div>
              <div className="flex justify-between gap-6 border-t border-slate-800/60 pt-1.5 mt-1.5 text-xs">
                <span className="text-slate-400 font-semibold">Profit Margin (NPM):</span>
                <span className="text-indigo-300 font-bold tabular-nums">
                  {((data[hoveredIndex].profit / data[hoveredIndex].sales) * 100).toFixed(2)}%
                </span>
              </div>
              {hoveredIndex > 0 && data[hoveredIndex - 1] && (
                <div className="flex justify-between gap-6 text-xs border-t border-slate-800/60 pt-1.5">
                  <span className="text-slate-400 font-semibold">YoY Sales Growth:</span>
                  {(() => {
                    const diff = data[hoveredIndex].sales - data[hoveredIndex - 1].sales;
                    const pct = (diff / data[hoveredIndex - 1].sales) * 100;
                    return (
                      <span className={`font-bold tabular-nums ${pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ShareholdingDonutChart({ stockData }: { stockData: any }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!stockData) return null;

  const data = parseLatestShareholding(stockData);
  if (data.length === 0) return null;

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const cx = 120;
  const cy = 120;
  const outerRadius = 95;
  const innerRadius = 65;

  const COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#64748b"];

  let currentAngle = 0;
  const slices = data.map((d, idx) => {
    const val = d.value;
    const angle = (val / (total || 1)) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + (angle >= 360 ? 359.99 : angle);
    currentAngle += angle;
    return {
      ...d,
      startAngle,
      endAngle,
      color: COLORS[idx % COLORS.length],
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center gap-8 shadow-lg">
      <div className="relative w-[240px] h-[240px] flex-shrink-0">
        <svg width="240" height="240" viewBox="0 0 240 240" className="overflow-visible">
          {slices.map((slice, idx) => {
            const isHovered = hoveredIdx === idx;
            const currentOuterRad = isHovered ? outerRadius + 6 : outerRadius;
            const currentInnerRad = isHovered ? innerRadius - 3 : innerRadius;
            
            const pathData = getDonutSlicePath(
              cx, cy,
              currentInnerRad, currentOuterRad,
              slice.startAngle, slice.endAngle
            );

            return (
              <path
                key={idx}
                d={pathData}
                fill={slice.color}
                className="transition-all duration-300 cursor-pointer"
                opacity={hoveredIdx !== null && !isHovered ? 0.6 : 1}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  filter: isHovered ? `drop-shadow(0 0 10px ${slice.color}50)` : "none"
                }}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {activeSlice ? (
            <>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                {activeSlice.category}
              </span>
              <span className="text-xl font-black text-white mt-1.5 leading-none">
                {activeSlice.value.toFixed(2)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                Ownership Mix
              </span>
              <span className="text-xs font-bold text-indigo-400 mt-2 leading-tight uppercase tracking-wider">
                Latest Qtr
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 w-full">
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">Shareholding Structure</span>
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5">
          {slices.map((slice, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  isHovered
                    ? "bg-indigo-950/20 border-indigo-500/35 text-white shadow-md shadow-indigo-500/5"
                    : "bg-slate-950/40 border-slate-800/40 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: slice.color,
                      boxShadow: isHovered ? `0 0 8px ${slice.color}` : "none"
                    }}
                  />
                  <span className="text-sm font-semibold">{slice.category}</span>
                </div>
                <span className="text-sm font-bold tabular-nums">{slice.value.toFixed(2)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuarterlyTrendChart({ stockData }: { stockData: any }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!stockData) return null;

  const data = parseQuarterlyFinancials(stockData);
  if (data.length === 0) return null;

  const width = 600;
  const height = 240;
  const padding = { top: 25, right: 65, bottom: 40, left: 65 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxSales = Math.max(...data.map(d => d.sales), 1);
  const maxProfit = Math.max(...data.map(d => d.profit), 1);

  const salesPoints = data.map((d, i) => {
    const x = padding.left + i * (chartWidth / (data.length - 1 || 1));
    const y = padding.top + chartHeight - (d.sales / maxSales) * chartHeight;
    return { x, y, ...d };
  });

  const profitPoints = data.map((d, i) => {
    const x = padding.left + i * (chartWidth / (data.length - 1 || 1));
    const y = padding.top + chartHeight - (d.profit / maxProfit) * chartHeight;
    return { x, y, ...d };
  });

  const salesPath = salesPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const profitPath = profitPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const formatCr = (val: number) => {
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k Cr`;
    return `₹${val.toFixed(0)} Cr`;
  };

  return (
    <div className="relative bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 w-full shadow-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <div>
          <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-5 h-5 text-indigo-400" /> Quarterly Sales & Net Profit
          </h4>
          <p className="text-xs text-slate-500 mt-1">Dual-axis view (Left: Sales, Right: Net Profit)</p>
        </div>
        <div className="flex gap-4 text-xs uppercase font-bold tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
            <span className="text-slate-300">Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-slate-300">Net Profit</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + chartHeight - ratio * chartHeight;
            const salesVal = ratio * maxSales;
            const profitVal = ratio * maxProfit;
            return (
              <g key={idx}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 3} fill="#475569" fontSize="9" fontWeight="black" textAnchor="end" className="tabular-nums">
                  {formatCr(salesVal)}
                </text>
                <text x={width - padding.right + 8} y={y + 3} fill="#059669" fontSize="9" fontWeight="black" textAnchor="start" className="tabular-nums">
                  {formatCr(profitVal)}
                </text>
              </g>
            );
          })}

          {/* Sales area & line */}
          <path
            d={`${salesPath} L ${salesPoints[salesPoints.length - 1].x} ${padding.top + chartHeight} L ${salesPoints[0].x} ${padding.top + chartHeight} Z`}
            fill="url(#salesAreaGrad2)"
            opacity="0.08"
          />
          <path
            d={salesPath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="drop-shadow(0 0 4px rgba(99,102,241,0.3))"
          />

          {/* Profit area & line */}
          <path
            d={`${profitPath} L ${profitPoints[profitPoints.length - 1].x} ${padding.top + chartHeight} L ${profitPoints[0].x} ${padding.top + chartHeight} Z`}
            fill="url(#profitAreaGrad2)"
            opacity="0.05"
          />
          <path
            d={profitPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="4 2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="drop-shadow(0 0 4px rgba(16,185,129,0.2))"
          />

          {/* Dots */}
          {data.map((_, idx) => {
            const pSales = salesPoints[idx];
            const pProfit = profitPoints[idx];
            const isHovered = hoveredIdx === idx;
            return (
              <g key={idx}>
                <circle
                  cx={pSales.x}
                  cy={pSales.y}
                  r={isHovered ? 6 : 4}
                  fill="#07090f"
                  stroke="#6366f1"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
                <circle
                  cx={pProfit.x}
                  cy={pProfit.y}
                  r={isHovered ? 6 : 4}
                  fill="#07090f"
                  stroke="#10b981"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
                <text
                  x={pSales.x}
                  y={padding.top + chartHeight + 18}
                  fill={isHovered ? "#ffffff" : "#64748b"}
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {pSales.quarter}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id="salesAreaGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="profitAreaGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            className="absolute z-10 bg-slate-950 border border-indigo-500/20 rounded-xl py-2 px-3 shadow-2xl pointer-events-none text-xs animate-in fade-in duration-100"
            style={{
              left: `${Math.min(width - 150, Math.max(10, salesPoints[hoveredIdx].x - 70))}px`,
              top: `${Math.min(height - 90, salesPoints[hoveredIdx].y - 30)}px`,
            }}
          >
            <div className="flex flex-col space-y-1">
              <span className="text-slate-500 font-bold border-b border-slate-800 pb-0.5 mb-0.5">{data[hoveredIdx].quarter}</span>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Sales:</span>
                <span className="text-white font-bold tabular-nums">₹{data[hoveredIdx].sales.toLocaleString("en-IN")} Cr</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400 font-medium">Net Profit:</span>
                <span className="text-emerald-400 font-bold tabular-nums">₹{data[hoveredIdx].profit.toLocaleString("en-IN")} Cr</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-800/60 pt-0.5 text-[10px]">
                <span className="text-slate-400 font-semibold">OPM %:</span>
                <span className="text-indigo-300 font-bold">
                  {((data[hoveredIdx].profit / data[hoveredIdx].sales) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CAGRScorecardGrid({ stockData }: { stockData: any }) {
  if (!stockData) return null;
  const rates = parseCompoundedRates(stockData);
  if (!rates || (!rates.sales.length && !rates.profit.length && !rates.stock.length && !rates.roe.length)) {
    return null;
  }

  const sections = [
    { title: "Compounded Sales Growth", data: rates.sales, color: "text-indigo-400", bg: "border-indigo-500/10 hover:border-indigo-500/20" },
    { title: "Compounded Profit Growth", data: rates.profit, color: "text-emerald-400", bg: "border-emerald-500/10 hover:border-emerald-500/20" },
    { title: "Stock Price CAGR", data: rates.stock, color: "text-amber-400", bg: "border-amber-500/10 hover:border-amber-500/20" },
    { title: "Return on Equity (ROE)", data: rates.roe, color: "text-violet-400", bg: "border-violet-500/10 hover:border-violet-500/20" },
  ];

  return (
    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-lg">
      <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">Compounded Growth & Efficiency Metrics</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {sections.map((sect) => {
          if (sect.data.length === 0) return null;
          return (
            <div key={sect.title} className={`bg-slate-950/60 border rounded-xl p-5 space-y-4 transition-all hover:shadow-md ${sect.bg}`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{sect.title}</span>
              <div className="space-y-3">
                {sect.data.map((item) => (
                  <div key={item.period} className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-semibold">{item.period}</span>
                    <span className={`font-extrabold tabular-nums ${sect.color}`}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AIReportPanel({ report, stockData }: { report: AIReport; stockData: any }) {
  const gen = new Date(report.generated_at).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">{report.company_name} ({report.ticker})</h2>
          <p className="text-indigo-400 text-base mt-1 font-medium">{report.executive_summary?.one_liner}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-semibold text-slate-400">
            <Brain className="w-4 h-4 text-indigo-400" /> AI Report · {gen}
          </span>
          <span className="font-medium">{report.data_sources?.annual_reports_count} annual report(s) · {report.data_sources?.fiscal_years_covered?.join(", ")}</span>
        </div>
      </div>

      {/* 1. Overview & Quality Score */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Quality Score card */}
        <div className="md:col-span-2 space-y-6">
          <InfoCard className="bg-slate-900/40 backdrop-blur-sm border-slate-800/80">
            <SectionHeading icon={<Star className="w-5 h-5" />} title="Business Quality Profile" />
            <div className="flex items-center gap-5 mb-6">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" strokeWidth="6" stroke="#1e293b" fill="none" />
                  <circle
                    cx="32" cy="32" r="26" strokeWidth="6" fill="none"
                    stroke={report.business_quality_score?.overall_score >= 7 ? "#22c55e" : report.business_quality_score?.overall_score >= 5 ? "#f59e0b" : "#ef4444"}
                    strokeDasharray={`${(report.business_quality_score?.overall_score / 10) * 163.4} 163.4`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-xl leading-none">
                    {report.business_quality_score?.overall_score}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-semibold">
                {report.business_quality_score?.score_rationale}
              </p>
            </div>
            <div className="space-y-4.5">
              {[
                ["Revenue Visibility", report.business_quality_score?.revenue_visibility],
                ["Management Quality", report.business_quality_score?.management_quality],
                ["Competitive Moat", report.business_quality_score?.competitive_moat],
                ["Balance Sheet Strength", report.business_quality_score?.balance_sheet_strength],
                ["Earnings Quality", report.business_quality_score?.earnings_quality],
                ["ESG Practices", report.business_quality_score?.esg_practices],
              ].map(([l, v]) => <ScoreBar key={l as string} label={l as string} value={v as number} />)}
            </div>
          </InfoCard>

          <ShareholdingDonutChart stockData={stockData} />
        </div>

        {/* Moat & Overview description */}
        <div className="md:col-span-3 space-y-6">
          <InfoCard className="bg-slate-900/40 backdrop-blur-sm border-slate-800/80">
            <SectionHeading icon={<Building2 className="w-5 h-5" />} title="Business Description" />
            <FormattedText text={report.executive_summary?.company_overview} />
          </InfoCard>
          <InfoCard className="bg-slate-900/40 backdrop-blur-sm border-slate-800/80">
            <SectionHeading icon={<Target className="w-5 h-5" />} title="Investment Thesis" />
            <FormattedText text={report.executive_summary?.investment_thesis} />
          </InfoCard>
        </div>
      </div>

      {/* 2. Financial Analysis */}
      <InfoCard className="bg-slate-900/40 backdrop-blur-sm border-slate-800/80 space-y-8">
        <SectionHeading icon={<BarChart3 className="w-5 h-5" />} title="Financial Snaps & Trends" />

        {/* Interactive SVG Charts */}
        <div className="grid grid-cols-1 gap-8">
          <InteractiveFinancialChart stockData={stockData} />
          <CAGRScorecardGrid stockData={stockData} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuarterlyTrendChart stockData={stockData} />
            <div className="bg-slate-950/80 border border-slate-800/60 rounded-2xl p-6 md:p-8 space-y-4">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block">Latest Quarter Highlights</span>
              <FormattedText text={report.financial_snapshot?.quarterly_highlights} />
            </div>
          </div>
        </div>

        {/* Financial commentary grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Revenue Trend", value: report.financial_snapshot?.revenue_trend },
            { label: "Profitability Trend", value: report.financial_snapshot?.profit_trend },
            { label: "Margin Analysis", value: report.financial_snapshot?.margin_analysis },
            { label: "Cash Flow Dynamics", value: report.financial_snapshot?.cash_flow_summary },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-950/80 border border-slate-800/60 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block">{label}</span>
              <FormattedText text={value} />
            </div>
          ))}
        </div>

        <div className="bg-slate-950/80 border border-slate-800/60 rounded-2xl p-6 md:p-8 space-y-3">
          <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block">Balance Sheet Capital Structure</span>
          <FormattedText text={report.financial_snapshot?.balance_sheet_health} />
        </div>

        {/* Key Ratios Table */}
        {report.financial_snapshot?.key_ratios?.length > 0 && (
          <div className="mt-8">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block mb-4">Longitudinal Return & Efficiency Ratios</span>
            <div className="overflow-x-auto border border-slate-800/60 rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50">
                    {["Ratio Name", "Latest Value", "Benchmark Target", "Strategic Interpretation"].map(h => (
                      <th key={h} className="text-left py-4 px-5 text-slate-400 font-black uppercase tracking-wider text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 bg-slate-950/20">
                  {report.financial_snapshot.key_ratios.map((r) => (
                    <tr key={r.name} className="hover:bg-indigo-950/5 transition-all">
                      <td className="py-4 px-5 font-semibold text-white">{r.name}</td>
                      <td className="py-4 px-5 text-indigo-300 font-bold tabular-nums">{r.value}</td>
                      <td className="py-4 px-5 text-slate-400">{r.benchmark || "—"}</td>
                      <td className="py-4 px-5 text-slate-300 leading-relaxed font-medium">{r.interpretation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </InfoCard>

      {/* 3. Bulls, Bears & Verdict */}
      <div className="space-y-6">
        {/* Stance Verdict Box */}
        {report.bull_bear_analysis?.verdict && (
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 md:p-8 flex gap-5">
            <CheckCircle2 className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block">Lead Analyst Verdict</span>
              <p className="text-base text-slate-100 mt-1.5 font-bold leading-relaxed">{report.bull_bear_analysis.verdict}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bulls */}
          <InfoCard className="bg-slate-900/40 backdrop-blur-sm border-slate-800/80">
            <SectionHeading icon={<TrendingUp className="w-5 h-5" />} title="Key Growth Drivers (Bull Case)" />
            <div className="space-y-4">
              {report.bull_bear_analysis?.bull_case?.map((b, i) => (
                <div key={i} className="flex gap-4 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl transition-all hover:bg-emerald-500/10">
                  <div className="flex-shrink-0 pt-0.5">
                    <StrengthDot s={b.strength} />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-white leading-tight">{b.point}</p>
                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed font-medium">{b.evidence}</p>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-extrabold capitalize mt-2.5 inline-block tracking-wider">
                      {b.strength} Evidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>

          {/* Bears */}
          <InfoCard className="bg-slate-900/40 backdrop-blur-sm border-slate-800/80">
            <SectionHeading icon={<TrendingDown className="w-5 h-5" />} title="Key Risks & Moat Killers (Bear Case)" />
            <div className="space-y-4">
              {report.bull_bear_analysis?.bear_case?.map((b, i) => (
                <div key={i} className="flex gap-4 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl transition-all hover:bg-red-500/10">
                  <div className="flex-shrink-0 pt-0.5">
                    <RiskBadge level={b.severity} />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-base font-extrabold text-white leading-tight">{b.point}</p>
                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed font-medium">{b.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>
      </div>

      {/* 4. Strategy & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
        {/* Strategy Card */}
        <div className="space-y-6">
          <InfoCard className="bg-slate-900/40 backdrop-blur-sm border-slate-800/80">
            <SectionHeading icon={<Zap className="w-5 h-5" />} title="Strategic Corporate Outlook" />
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block">Management Guidance & Outlook</span>
                <FormattedText text={report.strategic_outlook?.management_guidance} className="mt-1.5" />
              </div>
              <div>
                <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block">CapEx Allocations</span>
                <FormattedText text={report.strategic_outlook?.capex_plans} className="mt-1.5" />
              </div>
              <div>
                <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block">Long-term Vision</span>
                <FormattedText text={report.strategic_outlook?.long_term_vision} className="mt-1.5" />
              </div>
              <div>
                <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block">Key Growth Catalysts</span>
                <ul className="mt-3 space-y-2.5">
                  {report.strategic_outlook?.growth_catalysts?.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed font-medium">
                      <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      {renderBoldText(c)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </InfoCard>

          <InfoCard className="bg-slate-900/40 backdrop-blur-sm border-slate-800/80">
            <SectionHeading icon={<Leaf className="w-5 h-5" />} title="ESG Practices & Governance" />
            <div className="space-y-6">
              {[
                { label: "Environmental Stewardship", value: report.esg_summary?.environmental },
                { label: "Social Responsibilities", value: report.esg_summary?.social },
                { label: "Corporate Governance Quality", value: report.esg_summary?.governance },
                { label: "Corporate Social Responsibility (CSR)", value: report.esg_summary?.csr_initiatives },
                { label: "ESG Certifications & Ratings", value: report.esg_summary?.esg_rating_notes },
              ].map(({ label, value }) => value && (
                <div key={label}>
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block">{label}</span>
                  <FormattedText text={value} className="mt-1.5" />
                </div>
              ))}
            </div>
          </InfoCard>
        </div>

        {/* Risks & Monitorables Card */}
        <div className="space-y-6">
          <InfoCard className="bg-slate-900/40 backdrop-blur-sm border-slate-800/80">
            <SectionHeading icon={<Shield className="w-5 h-5" />} title="Operational Risk Matrix" />
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm text-slate-400 font-bold">Consolidated Risk Rating:</span>
              <RiskBadge level={report.risk_matrix?.overall_risk_level} />
            </div>
            <div className="space-y-4">
              {report.risk_matrix?.risks?.map((r, i) => (
                <div key={i} className="border border-slate-800/60 bg-slate-950/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-white">{r.name}</span>
                    <div className="flex gap-2">
                      <RiskBadge level={r.probability} />
                      <RiskBadge level={r.impact} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Mitigation Plan</span>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed font-medium">{r.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard className="bg-slate-900/40 backdrop-blur-sm border-slate-800/80">
            <SectionHeading icon={<Eye className="w-5 h-5" />} title="Key Monitorables (Watch Next 6-12 Months)" />
            <div className="grid grid-cols-1 gap-4">
              {report.key_monitorables?.map((m, i) => (
                <div key={i} className="flex items-start gap-4 p-5 bg-slate-950/60 border border-slate-800/60 rounded-2xl transition-all hover:border-slate-700/80">
                  <span className="text-indigo-400 font-black text-base flex-shrink-0 mt-0.5">#{i + 1}</span>
                  <p className="text-sm text-slate-200 leading-relaxed font-bold">{renderBoldText(m)}</p>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-slate-600 text-center leading-relaxed px-4 pt-4 pb-2 border-t border-slate-800/50">
        {report.disclaimer}
      </p>
    </div>
  );
}

const PARSING_STEPS = [
  "Initializing FinGuard Cognitive Engine...",
  "Querying consolidated stock metrics database...",
  "Running quantitative ratios & cash flow algorithms...",
  "Parsing quarterly balance sheet data points...",
  "Executing AI neural sentiment modeling on management guidance...",
  "Analyzing key risk variables & mitigation structures...",
  "Generating strategic outlook & peer analysis...",
  "Assembling final investment thesis report...",
];

const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`rounded bg-slate-800/60 ${className || ""}`} style={style} />
);

function AIReportSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-2.5 flex-1">
          <Skeleton className="h-8 w-1/3 rounded-lg animate-pulse" />
          <Skeleton className="h-4 w-2/3 rounded-md animate-pulse" />
        </div>
        <div className="space-y-2 flex flex-col items-end w-32">
          <Skeleton className="h-4 w-full rounded animate-pulse" />
          <Skeleton className="h-3 w-[80%] rounded animate-pulse" />
        </div>
      </div>

      {/* Grid of Overview & Quality Score */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Business Quality Profile Card Skeleton */}
        <div className="md:col-span-2 space-y-6 bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="w-5 h-5 rounded-full animate-pulse" />
            <Skeleton className="h-5 w-48 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-5 mb-6">
            {/* Pulsing Circle */}
            <div className="w-20 h-20 rounded-full border-[6px] border-slate-800 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-slate-800/80" />
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-full rounded animate-pulse" />
              <Skeleton className="h-3.5 w-[90%] rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24 rounded animate-pulse" />
                  <Skeleton className="h-3 w-8 rounded animate-pulse" />
                </div>
                <Skeleton className="h-2 w-full rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Overview & Thesis Skeletons */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-5 h-5 rounded animate-pulse" />
              <Skeleton className="h-5 w-40 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded animate-pulse" />
              <Skeleton className="h-4 w-[95%] rounded animate-pulse" />
              <Skeleton className="h-4 w-[90%] rounded animate-pulse" />
              <Skeleton className="h-4 w-[85%] rounded animate-pulse" />
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-5 h-5 rounded animate-pulse" />
              <Skeleton className="h-5 w-36 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded animate-pulse" />
              <Skeleton className="h-4 w-[98%] rounded animate-pulse" />
              <Skeleton className="h-4 w-[92%] rounded animate-pulse" />
              <Skeleton className="h-4 w-[80%] rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Financials Skeleton */}
      <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 space-y-8">
        <div className="flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded animate-pulse" />
          <Skeleton className="h-5 w-44 rounded animate-pulse" />
        </div>

        {/* Large Chart Area Skeleton */}
        <div className="h-64 border border-slate-800/60 bg-slate-950/40 rounded-2xl flex items-end justify-between p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/10 to-transparent -translate-x-full animate-shimmer" />
          {/* Fake chart bars */}
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-[6%] rounded-t-md animate-pulse"
              style={{
                height: `${20 + Math.sin(i * 0.8) * 40 + Math.random() * 20}%`,
                opacity: 0.4 + (i / 12) * 0.4
              }}
            />
          ))}
        </div>

        {/* Financial commentary grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-950/80 border border-slate-800/60 rounded-2xl p-5 space-y-3">
              <Skeleton className="h-3 w-24 rounded animate-pulse" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-full rounded animate-pulse" />
                <Skeleton className="h-3.5 w-[90%] rounded animate-pulse" />
                <Skeleton className="h-3.5 w-[75%] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

type ViewState = "idle" | "loading" | "report" | "not-found" | "error";

export default function StocksPage() {
  const [search, setSearch] = useState("");
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [report, setReport] = useState<AIReport | null>(null);
  const [stockData, setStockData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // States for premium multi-phase loader
  const [loadingPhase, setLoadingPhase] = useState<"none" | "parsing" | "skeleton">("none");
  const [parsingStep, setParsingStep] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [tempReportData, setTempReportData] = useState<{ report: AIReport; stockData: any } | null>(null);
  const [tempStatus, setTempStatus] = useState<{ isError: boolean; isNotFound: boolean; errorMsg?: string } | null>(null);

  // States for trial check
  const router = useRouter();
  const { dbUser, incrementReportsUsed } = useUserDb();
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);
  const reportsUsed = dbUser?.reportsUsed || 0;


  useEffect(() => {
    if (viewState !== "loading") {
      setLoadingPhase("none");
      return;
    }

    setLoadingPhase("parsing");
    setParsingStep(0);
    setMinTimeElapsed(false);

    // AI methods step interval: 8 steps, 320ms each = 2.56 seconds parsing time
    const interval = setInterval(() => {
      setParsingStep((prev) => {
        if (prev < PARSING_STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setLoadingPhase("skeleton");
          return prev;
        }
      });
    }, 320);

    // Total load time requirement: 4-5 seconds. Let's do 4.6 seconds total minimum.
    // That means at 4.6s, minTimeElapsed becomes true.
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 4600);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [viewState]);

  useEffect(() => {
    if (viewState !== "loading" || !minTimeElapsed) return;

    if (tempReportData) {
      setReport(tempReportData.report);
      setStockData(tempReportData.stockData);
      setViewState("report");
      setTempReportData(null);
      setTempStatus(null);
    } else if (tempStatus) {
      if (tempStatus.isNotFound) {
        setViewState("not-found");
      } else if (tempStatus.isError) {
        setErrorMsg(tempStatus.errorMsg || "An error occurred.");
        setViewState("error");
      }
      setTempReportData(null);
      setTempStatus(null);
    }
  }, [minTimeElapsed, tempReportData, tempStatus, viewState]);

  const fetchReport = async (ticker: string) => {
    const t = ticker.toUpperCase().trim();
    if (!t) return;
    
    // Check trial limit
    if (dbUser) {
      if (dbUser.plan === "FREE" && dbUser.reportsUsed >= 1) {
        setShowLimitReachedModal(true);
        return;
      }
      if (dbUser.plan === "STANDARD" && dbUser.reportsUsed >= 10) {
        setShowLimitReachedModal(true);
        return;
      }
    }


    // Reset loader data and start loading view state
    setTempReportData(null);
    setTempStatus(null);
    setMinTimeElapsed(false);
    setViewState("loading");
    setReport(null);
    setStockData(null);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/ai-reports/${t}`);
      const data = await res.json();

      if (res.ok && data.success && data.report?.executive_summary) {
        setTempReportData({
          report: data.report as AIReport,
          stockData: data.stockData || null
        });
        // Increment reports used in Neon DB
        await incrementReportsUsed();
      } else {
        setTempStatus({ isError: false, isNotFound: true });
      }
    } catch {
      setTempStatus({
        isError: true,
        isNotFound: false,
        errorMsg: "Cannot connect to backend. Make sure the server is running."
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(search);
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100">
      {/* Hero search */}
      <div className="border-b border-slate-800/50 bg-gradient-to-b from-slate-900/60 to-transparent">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Brain className="w-3 h-3" /> AI-Powered Equity Research
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Stock Intelligence
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Analyze Indian stock fundamentals instantly with analyst-grade AI models.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. RELIANCE, TCS, INFY…"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Analyse
            </button>
          </form>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">

        {/* Loading */}
        {viewState === "loading" && (
          <div className="w-full">
            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              .animate-shimmer {
                animation: shimmer 2.5s infinite linear;
              }
            `}</style>
            {loadingPhase === "parsing" ? (
              <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in duration-500">
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
                  {/* Background glows */}
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />

                  {/* Header of card */}
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-6 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Brain className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-base tracking-tight">FinGuard AI Engine</h3>
                        <p className="text-xs text-slate-400 font-semibold">Cognitive Broker v3.5 • Running</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      Parsing Data
                    </div>
                  </div>

                  {/* Steps List */}
                  <div className="space-y-4">
                    {PARSING_STEPS.map((step, idx) => {
                      const isCompleted = idx < parsingStep;
                      const isActive = idx === parsingStep;
                      const isPending = idx > parsingStep;

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-4 transition-all duration-300 ${
                            isCompleted
                              ? "text-slate-300"
                              : isActive
                              ? "text-indigo-400 scale-[1.01]"
                              : "text-slate-600 opacity-40"
                          }`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {isCompleted ? (
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            ) : isActive ? (
                              <div className="flex items-center justify-center w-5 h-5">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-5 h-5 rounded-full border border-slate-800 text-slate-600 text-[10px] font-extrabold">
                                {idx + 1}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm leading-relaxed ${isActive ? "font-bold" : "font-medium"}`}>
                              {step}
                            </span>
                            {isActive && (
                              <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-500 animate-pulse" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-8 pt-6 border-t border-slate-800/60 space-y-2">
                    <div className="flex justify-between text-xs font-black tracking-wider text-slate-400 uppercase">
                      <span>Neural Mapping Progress</span>
                      <span>{Math.round((parsingStep / (PARSING_STEPS.length - 1)) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${(parsingStep / (PARSING_STEPS.length - 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 text-xs font-bold text-indigo-300 animate-pulse">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI parsing complete. Integrating cognitive models into data panels...</span>
                  </div>
                  <span className="text-slate-500 font-medium">Stage 2 of 2</span>
                </div>
                <AIReportSkeleton />
              </div>
            )}
          </div>
        )}

        {/* Not found */}
        {viewState === "not-found" && (
          <div className="max-w-md mx-auto py-20 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">No Report Found</h3>
            <p className="text-slate-400 text-sm">
              No AI report exists for <strong className="text-white">{search.toUpperCase()}</strong> yet. This ticker may not be onboarded, or the index operation might have failed. Please contact the administrator to initiate ingestion for this stock.
            </p>
          </div>
        )}

        {/* Error */}
        {viewState === "error" && (
          <div className="max-w-md mx-auto py-20 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-red-400 font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* Report */}
        {viewState === "report" && report && (
          <AIReportPanel report={report} stockData={stockData} />
        )}

        {/* Idle state */}
        {viewState === "idle" && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto">
              {reportsUsed >= 1 ? (
                <AlertCircle className="w-7 h-7 text-rose-500" />
              ) : (
                <BarChart3 className="w-7 h-7 text-slate-600" />
              )}
            </div>
            
            {reportsUsed >= 1 ? (
              <div className="space-y-3 max-w-sm mx-auto">
                <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  Free Trial Expired
                </span>
                <p className="text-slate-400 text-sm font-medium">
                  You have used your 1 free AI report. Upgrade to continue analyzing stock financials.
                </p>
                <Link href="/plans" className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer">
                  Upgrade Subscription
                </Link>
              </div>
            ) : (
              <>
                <p className="text-slate-500 text-sm">Enter a ticker above to load its AI report.</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK"].map((t) => (
                    <button
                      key={t}
                      onClick={() => { setSearch(t); fetchReport(t); }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-400 border border-slate-800 rounded-full hover:border-indigo-500/40 hover:text-indigo-300 transition-all"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Trial Over Limit Modal */}
      {showLimitReachedModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Background Glow */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  {dbUser?.plan === "STANDARD" ? "Standard Limit Reached" : "Free Trial Over"}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  {dbUser?.plan === "STANDARD"
                    ? "Your 10-report monthly limit has been used. Please upgrade to Premium Pro for unlimited reports."
                    : "Your 1-report free trial has been used. Please select one of our premium subscription tiers to unlock unlimited AI Stock Intelligence features."
                  }
                </p>
              </div>


              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => router.push("/plans")}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  View Pricing Plans
                </button>
                <button
                  onClick={() => setShowLimitReachedModal(false)}
                  className="w-full py-3 text-slate-400 hover:text-white font-bold rounded-2xl text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
