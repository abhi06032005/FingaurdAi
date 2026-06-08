"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Info,
  TrendingUp,
  AlertTriangle,
  FileText,
  Loader2,
  Globe,
  Building2,
  DollarSign,
  Briefcase,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface StockResponse {
  ticker: string;
  lastUpdated: string;
  report: string;
  context: {
    profile: {
      companyName: string;
      isin: string | null;
      sector: string | null;
      industry: string | null;
      marketCap: number | null;
      website: string | null;
      description: string | null;
      headquarters: string | null;
      employees: number | null;
      listingDate: string | null;
    };
    business: {
      businessSummary?: string;
      businessModel?: string;
      competitiveAdvantages?: string;
      keyProducts?: string;
      keyServices?: string;
      keyCustomers?: string;
      majorSubsidiaries?: string;
      jointVentures?: string;
      geographicPresence?: string;
      industryPosition?: string;
      marketLeadershipNotes?: string;
    };
    segments: Array<{
      segmentName: string;
      revenueContribution: number | null;
      profitContribution: number | null;
      segmentDescription: string | null;
      year: number;
    }>;
    growth: {
      revenueCagr: number | null;
      netProfitCagr: number | null;
      history: Array<{
        year: number;
        revenue: number | null;
        ebitda: number | null;
        netProfit: number | null;
        eps: number | null;
        revenueYoY: number | null;
        netProfitYoY: number | null;
        bookValue: number | null;
        operatingCashFlow: number | null;
        freeCashFlow: number | null;
      }>;
    };
    profitability: {
      avgRoe: number | null;
      avgRoce: number | null;
      history: Array<{
        year: number;
        roe: number | null;
        roce: number | null;
        roa: number | null;
        grossMargin: number | null;
        operatingMargin: number | null;
        ebitdaMargin: number | null;
        netMargin: number | null;
        assetTurnover: number | null;
        interestCoverage: number | null;
        cashConversionRatio: number | null;
      }>;
    };
    balanceSheet: {
      history: Array<{
        year: number;
        assets: number | null;
        equity: number | null;
        cash: number | null;
        debt: number | null;
        netDebt: number;
        debtToEquity: number | null;
      }>;
    };
    valuation: {
      pe: number | null;
      forwardPe: number | null;
      pb: number | null;
      ps: number | null;
      peg: number | null;
      evEbitda: number | null;
      evSales: number | null;
      dividendYield: number | null;
      marketCap: number | null;
      enterpriseValue: number | null;
    };
    ownership: {
      trendNote: string;
      history: Array<{
        quarter: string;
        promoter: number | null;
        promoterPledged: number | null;
        fii: number | null;
        dii: number | null;
        publicHolding: number | null;
        others: number | null;
      }>;
    };
    orderBook: Array<{
      year: number;
      orderBookValue: number | null;
      orderInflows: number | null;
      bookToBillRatio: number | null;
      comments: string | null;
    }>;
    developments: Array<{
      title: string;
      category: string;
      summary: string | null;
      announcementDate: string;
      sourceUrl: string | null;
    }>;
    growthDrivers: Array<{
      driverType: string;
      description: string;
      importanceScore: number | null;
      source: string | null;
    }>;
    risks: Array<{
      riskType: string;
      description: string;
      severity: string;
    }>;
    managementCommentary: Array<{
      period: string;
      commentaryType: string;
      summary: string;
      source: string | null;
    }>;
  };
}

interface MarkdownRendererProps {
  content: string;
}

function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const parseInline = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-white">{part}</strong>;
      }
      return part;
    });
  };

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 my-3 space-y-1.5 text-slate-300 text-sm">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      flushList(index);
      elements.push(
        <h1 key={index} className="text-2xl font-bold text-white mt-6 mb-3 border-b border-slate-800 pb-1">
          {parseInline(trimmed.slice(2))}
        </h1>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(index);
      elements.push(
        <h2 key={index} className="text-xl font-bold text-white mt-5 mb-2.5">
          {parseInline(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList(index);
      elements.push(
        <h3 key={index} className="text-lg font-bold text-white mt-4 mb-2">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith('#### ')) {
      flushList(index);
      elements.push(
        <h4 key={index} className="text-base font-bold text-white mt-3.5 mb-1.5">
          {parseInline(trimmed.slice(5))}
        </h4>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(
        <li key={index} className="leading-relaxed">
          {parseInline(trimmed.slice(2))}
        </li>
      );
    } else if (trimmed === '') {
      flushList(index);
      elements.push(<div key={index} className="h-2" />);
    } else {
      flushList(index);
      elements.push(
        <p key={index} className="text-slate-300 leading-relaxed text-sm my-2">
          {parseInline(trimmed)}
        </p>
      );
    }
  });

  flushList(lines.length);

  return <div className="space-y-1">{elements}</div>;
}

export default function StockAnalyzer() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [stockData, setStockData] = useState<StockResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableStocks, setAvailableStocks] = useState<Array<{ ticker: string; companyName: string }>>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const res = await fetch(`${API_BASE}/symbol`);
        if (res.ok) {
          const data = await res.json();
          setAvailableStocks(data);
        }
      } catch (err) {
        console.error("Failed to fetch available stocks:", err);
      }
    };
    fetchAvailable();
  }, []);

  const performSearch = async (ticker: string) => {
    if (!ticker) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setStockData(null);

    try {
      const res = await fetch(`${API_BASE}/symbol/${ticker}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `No pre-computed report found for ticker ${ticker}.`);
      }

      setStockData(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "Failed to connect to backend server. Make sure the API service is active."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = search.trim().toUpperCase();
    if (ticker) {
      router.push(`/stock/${ticker}`);
    }
  };

  const handleBadgeClick = (ticker: string) => {
    setSearch(ticker);
    if (ticker) {
      router.push(`/stock/${ticker}`);
    }
  };

  const fmtCurrency = (val: number | null) => {
    if (val == null) return "—";
    return `₹${val.toLocaleString("en-IN")} Cr`;
  };

  const fmtPercent = (val: number | null) => {
    if (val == null) return "—";
    return `${val.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Title and Search Form */}
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            AI Stock Analysis Platform
          </h1>
          <p className="text-slate-400 text-lg">
            Enter an NSE ticker symbol to read our pre-computed financials and AI-powered research reports.
          </p>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g., RELIANCE, TCS, HDFCBANK, INFY..."
              className="flex-1 text-lg py-6 bg-[#0b101c] border-slate-800 text-slate-200 placeholder-slate-600 focus:border-primary/50"
            />
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/95 text-white font-semibold shadow-lg shadow-primary/20 px-8">
              <Search className="w-5 h-5 mr-2" /> Search
            </Button>
          </form>

          {availableStocks.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center justify-center max-w-3xl mx-auto mt-4 text-xs">
              <span className="text-slate-500 font-medium mr-1 uppercase tracking-wider text-[10px]">Database Stocks:</span>
              {availableStocks.map((stock) => (
                <button
                  key={stock.ticker}
                  type="button"
                  onClick={() => handleBadgeClick(stock.ticker)}
                  className="px-2.5 py-1 bg-slate-900/60 hover:bg-primary/20 border border-slate-850 hover:border-primary/40 text-xs font-semibold rounded-full text-slate-300 hover:text-white transition cursor-pointer"
                  title={stock.companyName}
                >
                  {stock.ticker}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading and Error blocks */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-slate-400 animate-pulse text-sm">Retrieving stock context and compiling research report...</p>
          </div>
        )}

        {error && (
          <Card className="max-w-xl mx-auto border-rose-500/20 bg-rose-950/10 text-slate-100">
            <CardHeader className="flex flex-row items-center space-x-3 pb-3">
              <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
              <CardTitle className="text-lg text-rose-400">Stock Research Not Found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                {error}
              </p>
              <div className="text-xs bg-slate-950 p-3 rounded text-slate-500 font-mono">
                💡 Admin Tip: Access the Admin Panel to run the ingestion scrapers for {search.toUpperCase()} first to precompute its intelligence context.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dynamic stock dashboard content */}
        {stockData && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left and Middle column (Details, Tables) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Company Info Banner */}
              <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-xl">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-3xl font-extrabold text-white">
                          {stockData.context.profile.companyName}
                        </CardTitle>
                        <Badge className="bg-primary/10 border-primary/20 text-primary">NSE: {stockData.ticker}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-sm mt-2 font-medium">
                        {stockData.context.profile.sector && (
                          <span className="flex items-center">
                            <Briefcase className="w-3.5 h-3.5 mr-1.5 opacity-60" /> Sector: {stockData.context.profile.sector}
                          </span>
                        )}
                        {stockData.context.profile.industry && (
                          <span className="flex items-center">
                            <Building2 className="w-3.5 h-3.5 mr-1.5 opacity-60" /> Industry: {stockData.context.profile.industry}
                          </span>
                        )}
                        {stockData.context.profile.isin && (
                          <span className="text-xs font-mono bg-slate-950/60 px-2 py-0.5 rounded text-slate-500 border border-slate-900">
                            ISIN: {stockData.context.profile.isin}
                          </span>
                        )}
                      </div>
                    </div>
                    {stockData.context.profile.website && (
                      <a
                        href={stockData.context.profile.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                      >
                        <Globe className="w-4 h-4 mr-1.5" /> Visit Website
                      </a>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Ratios Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Market Cap", value: fmtCurrency(stockData.context.valuation.marketCap), desc: "Current Valuation" },
                  { label: "Stock P/E", value: stockData.context.valuation.pe ?? "—", desc: "Price-to-Earnings" },
                  { label: "Price to Book (P/B)", value: stockData.context.valuation.pb ?? "—", desc: "Price-to-Book ratio" },
                  { label: "Dividend Yield", value: fmtPercent(stockData.context.valuation.dividendYield), desc: "Annual Yield" },
                  { label: "PEG Ratio", value: stockData.context.valuation.peg ?? "—", desc: "PE / Growth Rate" },
                  { label: "EV / EBITDA", value: stockData.context.valuation.evEbitda ?? "—", desc: "Enterprise Value ratio" },
                  { label: "Avg ROE (3-5Y)", value: fmtPercent(stockData.context.profitability.avgRoe), desc: "Return on Equity" },
                  { label: "Avg ROCE (3-5Y)", value: fmtPercent(stockData.context.profitability.avgRoce), desc: "Return on Capital" }
                ].map((stat) => (
                  <Card key={stat.label} className="border-slate-800 bg-slate-900/30 backdrop-blur-md">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">{stat.label}</span>
                        <span className="text-xl font-bold text-white block">{stat.value}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-2 block select-none leading-none">{stat.desc}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Detailed Navigation Tabs */}
              <Tabs defaultValue="report" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-slate-950/80 border border-slate-900 rounded-lg p-1.5 h-auto">
                  <TabsTrigger value="report" className="py-2.5 text-xs font-semibold">AI Report</TabsTrigger>
                  <TabsTrigger value="overview" className="py-2.5 text-xs font-semibold">Business Info</TabsTrigger>
                  <TabsTrigger value="financials" className="py-2.5 text-xs font-semibold">Growth History</TabsTrigger>
                  <TabsTrigger value="ownership" className="py-2.5 text-xs font-semibold">Shareholding</TabsTrigger>
                  <TabsTrigger value="commentary" className="py-2.5 text-xs font-semibold">Commentary</TabsTrigger>
                </TabsList>
                
                {/* AI Research Report */}
                <TabsContent value="report" className="mt-6">
                  <Card className="border-slate-800 bg-slate-900/20 backdrop-blur-xl">
                    <CardHeader className="border-b border-slate-900 pb-4">
                      <CardTitle className="text-lg flex items-center text-white font-bold">
                        <FileText className="w-5 h-5 mr-2 text-primary" /> Generated Equity Research Report
                      </CardTitle>
                      <CardDescription>Generated by senior AI analyst from database context</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="font-sans leading-relaxed text-slate-300 text-sm select-all space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        <MarkdownRenderer content={stockData.report} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Business Info */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                  <Card className="border-slate-800 bg-slate-900/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center text-white">
                        <Info className="w-5 h-5 mr-2 text-primary" /> Business Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-300 leading-relaxed text-sm">
                        {stockData.context.profile.description || "No description available."}
                      </p>
                      {stockData.context.business.businessModel && (
                        <div>
                          <h4 className="font-bold text-sm text-white mb-1.5">Business Model:</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{stockData.context.business.businessModel}</p>
                        </div>
                      )}
                      {stockData.context.business.competitiveAdvantages && (
                        <div>
                          <h4 className="font-bold text-sm text-white mb-1.5">Competitive Advantages (Moat):</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{stockData.context.business.competitiveAdvantages}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Business segments */}
                  {stockData.context.segments.length > 0 && (
                    <Card className="border-slate-800 bg-slate-900/20">
                      <CardHeader><CardTitle className="text-sm font-bold text-white">Operational Segments</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {stockData.context.segments.map((seg, idx) => (
                            <div key={idx} className="bg-slate-950/40 border border-slate-900 p-3 rounded">
                              <h5 className="font-semibold text-xs text-white uppercase tracking-wider">{seg.segmentName}</h5>
                              <div className="flex justify-between mt-2 text-xs text-slate-400">
                                <span>Revenue: {fmtPercent(seg.revenueContribution)}</span>
                                <span>Profit: {fmtPercent(seg.profitContribution)}</span>
                              </div>
                              {seg.segmentDescription && (
                                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{seg.segmentDescription}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Financial History Table */}
                <TabsContent value="financials" className="mt-6 space-y-6">
                  <Card className="border-slate-800 bg-slate-900/20">
                    <CardHeader>
                      <CardTitle className="text-lg text-white font-bold">5-Year Growth Statement</CardTitle>
                      <CardDescription>Annual balance sheet and cash flow indicators (Values in ₹ Crore)</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase select-none">
                            <th className="py-2.5">Year</th>
                            <th className="py-2.5">Revenue</th>
                            <th className="py-2.5">EBITDA</th>
                            <th className="py-2.5">Net Profit</th>
                            <th className="py-2.5">Debt</th>
                            <th className="py-2.5">Op. Cash Flow</th>
                            <th className="py-2.5">Free Cash Flow</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {stockData.context.growth.history.map((row) => (
                            <tr key={row.year} className="text-slate-300 hover:bg-slate-900/20">
                              <td className="py-3 font-semibold text-white">{row.year}</td>
                              <td className="py-3">{fmtCurrency(row.revenue)}</td>
                              <td className="py-3">{fmtCurrency(row.ebitda)}</td>
                              <td className="py-3">{fmtCurrency(row.netProfit)}</td>
                              <td className="py-3">{fmtCurrency(row.bookValue)}</td>
                              <td className="py-3">{fmtCurrency(row.operatingCashFlow)}</td>
                              <td className="py-3">{fmtCurrency(row.freeCashFlow)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Shareholding Pattern */}
                <TabsContent value="ownership" className="mt-6">
                  <Card className="border-slate-800 bg-slate-900/20">
                    <CardHeader>
                      <CardTitle className="text-lg text-white font-bold">Quarterly Shareholding (%)</CardTitle>
                      <CardDescription>{stockData.context.ownership.trendNote}</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase select-none">
                            <th className="py-2.5">Quarter</th>
                            <th className="py-2.5">Promoter %</th>
                            <th className="py-2.5">Pledged %</th>
                            <th className="py-2.5">FII %</th>
                            <th className="py-2.5">DII %</th>
                            <th className="py-2.5">Public %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {stockData.context.ownership.history.map((row) => (
                            <tr key={row.quarter} className="text-slate-300 hover:bg-slate-900/20">
                              <td className="py-3 font-semibold text-white">{row.quarter}</td>
                              <td className="py-3">{row.promoter?.toFixed(2) ?? "—"}%</td>
                              <td className="py-3 text-amber-500">{row.promoterPledged?.toFixed(2) ?? "0.00"}%</td>
                              <td className="py-3">{row.fii?.toFixed(2) ?? "—"}%</td>
                              <td className="py-3">{row.dii?.toFixed(2) ?? "—"}%</td>
                              <td className="py-3">{row.publicHolding?.toFixed(2) ?? "—"}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Commentary */}
                <TabsContent value="commentary" className="mt-6">
                  <Card className="border-slate-800 bg-slate-900/20">
                    <CardHeader><CardTitle className="text-sm font-bold text-white">Management commentary summaries</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {stockData.context.managementCommentary.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No management commentary summaries archived for this stock.</p>
                      ) : (
                        stockData.context.managementCommentary.map((comm, idx) => (
                          <div key={idx} className="border-b border-slate-900 pb-3 last:border-0">
                            <div className="flex justify-between items-start">
                              <Badge className="bg-primary/5 text-primary text-[10px] uppercase border-primary/20">{comm.commentaryType}</Badge>
                              <span className="text-[10px] text-slate-500 font-semibold">{comm.period}</span>
                            </div>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{comm.summary}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right column (Summary Widgets, Risks, Developments) */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Qualitative Drivers card */}
              <Card className="border-primary/10 bg-slate-900/40 backdrop-blur-xl shadow-xl">
                <CardHeader className="bg-primary/5 border-b border-slate-900 pb-3">
                  <CardTitle className="text-base text-white font-bold">🎯 Strategic Growth Drivers</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {stockData.context.growthDrivers.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No strategic growth drivers listed.</p>
                  ) : (
                    stockData.context.growthDrivers.map((drv, idx) => (
                      <div key={idx} className="bg-slate-950/40 border border-slate-900 p-3 rounded space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-white">{drv.driverType}</span>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase">
                            Score: {drv.importanceScore}/10
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">{drv.description}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Company Risks card */}
              <Card className="border-rose-500/15 bg-slate-900/40 backdrop-blur-xl shadow-xl">
                <CardHeader className="bg-rose-950/5 border-b border-slate-900 pb-3">
                  <CardTitle className="text-base text-white font-bold">⚠️ Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {stockData.context.risks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No risk assessments loaded.</p>
                  ) : (
                    stockData.context.risks.map((risk, idx) => {
                      let sevColor = "bg-slate-800 text-slate-400 border-slate-700/50";
                      if (risk.severity === "High") sevColor = "bg-rose-950/20 text-rose-400 border-rose-500/25";
                      if (risk.severity === "Medium") sevColor = "bg-amber-950/20 text-amber-400 border-amber-500/25";
                      
                      return (
                        <div key={idx} className="bg-slate-950/40 border border-slate-900 p-3 rounded space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-white">{risk.riskType}</span>
                            <Badge className={`text-[9px] uppercase border ${sevColor}`}>
                              {risk.severity} Risk
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal">{risk.description}</p>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Order book details (if applicable) */}
              {stockData.context.orderBook.length > 0 && (
                <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
                  <CardHeader className="border-b border-slate-900 pb-3">
                    <CardTitle className="text-sm font-bold text-white">📦 Order Book Status</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2 text-xs">
                    {stockData.context.orderBook.map((ob, idx) => (
                      <div key={idx} className="space-y-1.5 border-b border-slate-900 pb-2 last:border-0">
                        <div className="flex justify-between font-semibold text-slate-300">
                          <span>FY {ob.year} Book Value:</span>
                          <span className="text-white">{fmtCurrency(ob.orderBookValue)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Order Inflows:</span>
                          <span>{fmtCurrency(ob.orderInflows)}</span>
                        </div>
                        {ob.bookToBillRatio && (
                          <div className="flex justify-between text-slate-400">
                            <span>Book-to-Bill Ratio:</span>
                            <span>{ob.bookToBillRatio.toFixed(2)}x</span>
                          </div>
                        )}
                        {ob.comments && (
                          <p className="text-[10px] text-slate-500 leading-relaxed mt-1 italic">"{ob.comments}"</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recent Developments list */}
              <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
                <CardHeader className="border-b border-slate-900 pb-3">
                  <CardTitle className="text-base text-white font-bold">📅 Corporate Developments</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {stockData.context.developments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No recent corporate developments recorded.</p>
                  ) : (
                    stockData.context.developments.map((dev, idx) => (
                      <div key={idx} className="border-b border-slate-900 pb-3 last:border-0 space-y-1 text-xs">
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-semibold text-white leading-snug">{dev.title}</span>
                          <Badge className="bg-primary/5 text-primary text-[8px] uppercase flex-shrink-0 border-primary/20">{dev.category}</Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">{dev.summary}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 select-none">
                          <span>{new Date(dev.announcementDate).toLocaleDateString()}</span>
                          {dev.sourceUrl && (
                            <a href={dev.sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold flex items-center">
                              PDF Filings <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
