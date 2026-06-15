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
      <div className="fg-shell min-h-screen text-foreground flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-xl shadow-sm border border-border text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-foreground mb-2">Data not found</h2>
          <p className="text-muted-foreground mb-6">We could not load the data for {ticker}.</p>
          <Link href="/stocks" className="text-primary hover:underline inline-flex items-center">
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

    let subtitle = "Consolidated Figures in Rs. Crores";
    if (title === "Ratios") {
      subtitle = "";
    } else if (title === "Shareholding Pattern") {
      subtitle = "Numbers in percentages";
    }

    return (
      <section className="bg-card rounded-xl border border-border overflow-hidden mb-8 shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase hidden sm:block">
              {subtitle}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-card border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium text-muted-foreground w-64 bg-muted/10 sticky left-0 z-10">Metric</th>
                {periods.map(p => (
                  <th key={p} className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row, i) => {
                const rowLabel = row.Metric || row[''] || '';
                return (
                  <tr key={i} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-3 font-medium text-foreground bg-card group-hover:bg-muted/50 sticky left-0 z-10 whitespace-nowrap border-r border-border">
                      {rowLabel}
                    </td>
                    {periods.map(p => {
                      const val = row[p];
                      const isNegative = typeof val === 'number' && val < 0;

                      let displayVal = "";
                      if (val !== null && val !== undefined && val !== "") {
                        if (typeof val === 'number') {
                          const rowLabelLower = rowLabel.toLowerCase();
                          if (title === "Shareholding Pattern") {
                            if (rowLabelLower.includes("shareholders")) {
                              displayVal = val.toLocaleString('en-IN');
                            } else {
                              displayVal = `${val.toFixed(2)}%`;
                            }
                          } else if (rowLabel.includes("%")) {
                            displayVal = `${val}%`;
                          } else {
                            if (Number.isInteger(val)) {
                              displayVal = val.toLocaleString('en-IN');
                            } else {
                              displayVal = val.toLocaleString('en-IN', {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2
                                });
                            }
                          }
                        } else {
                          displayVal = val.toString();
                        }
                      }

                      return (
                        <td key={p} className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                          <span className={isNegative ? "text-rose-650 dark:text-rose-450" : "text-foreground"}>
                            {displayVal}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderCagrTable = (title: string, data: any[]) => {
    if (!data || data.length === 0) return null;
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm flex-1">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <table className="w-full text-sm text-left">
          <tbody className="divide-y divide-border">
            {data.map((row, i) => {
              const key = Object.keys(row)[0];
              const val = row[key];
              return (
                <tr key={i} className="hover:bg-muted/50">
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{key}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums text-foreground">{val}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper to get latest non-null value for a metric from a rows array
  const getLatestMetric = (rows: any[] | undefined, metricName: string): number | null => {
    if (!Array.isArray(rows)) return null;
    const row = rows.find((r: any) => r.Metric === metricName);
    if (!row) return null;
    const periods = Object.keys(row).filter(k => k !== 'Metric' && k !== '_id' && k !== '__v');
    for (let i = periods.length - 1; i >= 0; i--) {
      const v = row[periods[i]];
      if (v !== null && v !== undefined) return typeof v === 'number' ? v : parseFloat(String(v));
    }
    return null;
  };

  // P&L rows (handle both plain array and object with annual_data)
  const pnlRows: any[] = Array.isArray(stockData.profit_and_loss)
    ? stockData.profit_and_loss
    : (stockData.profit_and_loss?.annual_data ?? []);

  const latestSales      = getLatestMetric(pnlRows, 'Sales');
  const latestNetProfit  = getLatestMetric(pnlRows, 'Net Profit');
  const latestOPM        = getLatestMetric(pnlRows, 'OPM %');
  const latestEPS        = getLatestMetric(pnlRows, 'EPS in Rs');
  const latestDivPayout  = getLatestMetric(pnlRows, 'Dividend Payout %');

  // Balance sheet totals
  const bsRows: any[] = Array.isArray(stockData.balance_sheet) ? stockData.balance_sheet : [];
  const latestEquity     = getLatestMetric(bsRows, 'Equity Capital');
  const latestReserves   = getLatestMetric(bsRows, 'Reserves');
  const netWorth = (latestEquity !== null && latestReserves !== null)
    ? latestEquity + latestReserves : null;

  // Free Cash Flow
  const cfRows: any[] = Array.isArray(stockData.cash_flow) ? stockData.cash_flow : [];
  const latestFCF = getLatestMetric(cfRows, 'Free Cash Flow');

  // Extract latest ROCE from ratios table
  const roceRow = stockData.ratios?.find((r: any) => (r.Metric || r['']) === 'ROCE %');
  let roceValue = 'N/A';
  if (roceRow) {
    const periods = Object.keys(roceRow).filter(k => k !== 'Metric' && k !== '' && k !== '_id');
    const latestPeriod = periods[periods.length - 1];
    if (latestPeriod && roceRow[latestPeriod] !== null) {
      roceValue = typeof roceRow[latestPeriod] === 'number'
        ? roceRow[latestPeriod].toFixed(1)
        : roceRow[latestPeriod].toString();
    }
  }

  // Extract latest ROE
  const roeData = stockData.profit_and_loss?.["Return on Equity"];
  let roeValue = 'N/A';
  if (roeData && Array.isArray(roeData)) {
    const lastYearRow = roeData.find((r: any) => Object.keys(r)[0]?.toLowerCase().includes('last year'));
    if (lastYearRow) {
      const key = Object.keys(lastYearRow)[0];
      const val = lastYearRow[key];
      roeValue = typeof val === 'number' ? val.toFixed(1) : (val?.toString() || 'N/A');
    }
  }

  // Sales CAGR 3Y
  const salesCagrArr = stockData.profit_and_loss?.['Compounded Sales Growth'];
  let salesCagr3Y = 'N/A';
  if (Array.isArray(salesCagrArr)) {
    const row = salesCagrArr.find((r: any) => String(Object.keys(r)[0]).includes('3'));
    if (row) { const v = Object.values(row)[0]; salesCagr3Y = `${v}%`; }
  }

  const fmt = (n: number | null, prefix = '', suffix = '') =>
    n !== null ? `${prefix}${n.toLocaleString('en-IN')}${suffix}` : 'N/A';

  const topStats = [
    { label: 'Revenue (Latest FY)',  value: fmt(latestSales, '\u20B9', ' Cr'),     suffix: '' },
    { label: 'Net Profit (FY)',      value: fmt(latestNetProfit, '\u20B9', ' Cr'), suffix: '' },
    { label: 'OPM %',               value: latestOPM !== null ? `${latestOPM}%` : 'N/A', suffix: '' },
    { label: 'EPS (Latest FY)',      value: latestEPS !== null ? `\u20B9${latestEPS.toFixed(2)}` : 'N/A', suffix: '' },
    { label: 'Dividend Payout',      value: latestDivPayout !== null ? `${latestDivPayout}%` : 'N/A', suffix: '' },
    { label: 'ROCE',                 value: roceValue !== 'N/A' ? `${roceValue}%` : 'N/A', suffix: '' },
    { label: 'ROE',                  value: roeValue  !== 'N/A' ? `${roeValue}%` : 'N/A',  suffix: '' },
    { label: 'Free Cash Flow',       value: fmt(latestFCF, '\u20B9', ' Cr'),       suffix: '' },
    { label: 'Sales CAGR (3Y)',      value: salesCagr3Y, suffix: '' },
  ];

  return (
    <div className="fg-shell min-h-screen text-foreground font-sans pb-20">
      
      {/* Top Navbar Simulation */}
      <div className="bg-background/95 border-b border-border sticky top-0 z-50 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/stocks" className="flex items-center gap-2 text-primary hover:text-primary/95 font-bold tracking-tight text-xl">
            Screener<span className="text-foreground">Demo</span>
          </Link>
          <div className="relative hidden md:block w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder={`Search for a company`} 
              className="w-full bg-muted border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              defaultValue={ticker}
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="bg-card rounded-xl border border-border p-6 md:p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{stockData.company_name}</h1>
              <div className="flex gap-4 mt-2 text-sm text-primary font-medium">
                <a href="#" className="hover:underline flex items-center">BSE: 532540</a>
                <a href="#" className="hover:underline flex items-center">NSE: {ticker}</a>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium border border-border rounded-xl hover:bg-muted bg-card transition-colors flex items-center shadow-sm text-foreground cursor-pointer">
                + ADD TO WATCHLIST
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-8 gap-x-8">
            {topStats.map((stat, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">{stat.label}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-2xl font-bold text-foreground tabular-nums">{stat.value}</span>
                  {stat.suffix && <span className="text-sm font-semibold text-muted-foreground">{stat.suffix}</span>}
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
