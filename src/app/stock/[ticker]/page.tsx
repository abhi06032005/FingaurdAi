import React from "react";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { Search } from "lucide-react";

// Server component
export default async function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  
  let stockData: any = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await fetch(`${apiUrl}/api/stocks/${ticker}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      stockData = await res.json();
    } else {
      console.error(`Failed to fetch stock data: ${res.status} ${res.statusText}`);
    }
  } catch (error) {
    console.error("Failed to read stock data from DB API:", error);
  }
  if (!stockData) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Data not found</h2>
          <p className="text-slate-600 mb-6">We could not load the data for {ticker}.</p>
          <Link href="/stocks" className="text-blue-600 hover:underline inline-flex items-center">
            <Search className="w-4 h-4 mr-2" />
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  // Helper to extract keys that look like dates/quarters from a row
  const getPeriodKeys = (row: any) => {
    return Object.keys(row).filter(k => k !== 'Metric' && k !== '');
  };

  const renderTable = (title: string, data: any[]) => {
    if (!data || data.length === 0) return null;
    const periods = getPeriodKeys(data[0]);

    return (
      <section className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-8 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <span className="text-xs text-slate-500 font-medium tracking-wide uppercase hidden sm:block">Consolidated Figures in Rs. Crores</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500 w-64 bg-slate-50/30 sticky left-0 z-10">Metric</th>
                {periods.map(p => (
                  <th key={p} className="px-4 py-3 font-medium text-slate-600 text-right whitespace-nowrap">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-3 font-medium text-slate-700 bg-white group-hover:bg-slate-50/80 sticky left-0 z-10 whitespace-nowrap border-r border-slate-100/50">
                    {row.Metric || row['']}
                  </td>
                  {periods.map(p => {
                    const val = row[p];
                    const isNegative = typeof val === 'number' && val < 0;
                    return (
                      <td key={p} className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                        <span className={isNegative ? "text-red-600" : "text-slate-800"}>
                          {val === null ? "" : (typeof val === 'number' ? val.toLocaleString('en-IN') : val)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderCagrTable = (title: string, data: any[]) => {
    if (!data || data.length === 0) return null;
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm flex-1">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>
        <table className="w-full text-sm text-left">
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => {
              const key = Object.keys(row)[0];
              const val = row[key];
              return (
                <tr key={i} className="hover:bg-slate-50/80">
                  <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{key}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums text-slate-800">{val}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Mock top header stats since tsc_data.json doesn't have a direct top-level ratios object for TCS
  const topStats = [
    { label: "Market Cap", value: "₹ 15,23,456", suffix: "Cr." },
    { label: "Current Price", value: "₹ 4,120", suffix: "" },
    { label: "High / Low", value: "₹ 4,254 / 3,156", suffix: "" },
    { label: "Stock P/E", value: "30.5", suffix: "" },
    { label: "Book Value", value: "₹ 295", suffix: "" },
    { label: "Dividend Yield", value: "1.75", suffix: "%" },
    { label: "ROCE", value: "63.0", suffix: "%" },
    { label: "ROE", value: "52.0", suffix: "%" },
    { label: "Face Value", value: "₹ 1.00", suffix: "" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans selection:bg-blue-100 pb-20">
      
      {/* Top Navbar Simulation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/stocks" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold tracking-tight text-xl">
            Screener<span className="text-slate-800">Demo</span>
          </Link>
          <div className="relative hidden md:block w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Search for a company`} 
              className="w-full bg-slate-100 border-none rounded-md pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              defaultValue={ticker}
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stockData.company_name}</h1>
              <div className="flex gap-4 mt-2 text-sm text-blue-600 font-medium">
                <a href="#" className="hover:underline flex items-center">BSE: 532540</a>
                <a href="#" className="hover:underline flex items-center">NSE: {ticker}</a>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-50 bg-white transition-colors flex items-center shadow-sm text-slate-700">
                + ADD TO WATCHLIST
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-8 gap-x-8">
            {topStats.map((stat, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">{stat.label}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-2xl font-bold text-slate-800 tabular-nums">{stat.value}</span>
                  {stat.suffix && <span className="text-sm font-semibold text-slate-500">{stat.suffix}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sections */}
        <div className="space-y-10">
          
          {/* Quarters */}
          <div id="quarters">
            {renderTable("Quarterly Results", stockData.quarters)}
          </div>

          {/* Profit & Loss */}
          <div id="profit-loss">
            {renderTable("Profit & Loss", stockData.profit_and_loss?.annual_data)}
          </div>

          {/* CAGR Grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderCagrTable("Compounded Sales Growth", stockData.profit_and_loss?.["Compounded Sales Growth"])}
            {renderCagrTable("Compounded Profit Growth", stockData.profit_and_loss?.["Compounded Profit Growth"])}
            {renderCagrTable("Stock Price CAGR", stockData.profit_and_loss?.["Stock Price CAGR"])}
            {renderCagrTable("Return on Equity", stockData.profit_and_loss?.["Return on Equity"])}
          </div>

          {/* Balance Sheet */}
          <div id="balance-sheet" className="mt-10">
            {renderTable("Balance Sheet", stockData.balance_sheet)}
          </div>

          {/* Cash Flow */}
          <div id="cash-flow">
            {renderTable("Cash Flows", stockData.cash_flow)}
          </div>

          {/* Ratios */}
          <div id="ratios">
            {renderTable("Ratios", stockData.ratios)}
          </div>

          {/* Shareholding Pattern */}
          <div id="shareholding">
            {renderTable("Shareholding Pattern", stockData.shareholding?.quarterly)}
          </div>

        </div>

      </main>
    </div>
  );
}
