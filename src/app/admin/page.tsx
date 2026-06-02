"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Database,
  Play,
  Square,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface CompanyStatus {
  ticker: string;
  status: "Completed" | "Pending" | "Failed" | "Scraping";
  lastUpdated: string | null;
}

interface LogEntry {
  timestamp: string;
  text: string;
  type: "info" | "success" | "error" | "warn";
}

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<CompanyStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Completed" | "Pending" | "Failed">("All");
  const [isBulkScraping, setIsBulkScraping] = useState(false);
  const [progress, setProgress] = useState({
    total: 0,
    current: 0,
    ticker: "",
    completed: [] as string[],
    failed: [] as string[],
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const prevCompletedRef = useRef<string[]>([]);
  const prevFailedRef = useRef<string[]>([]);

  // Add a log entry
  const addLog = (text: string, type: "info" | "success" | "error" | "warn" = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp: time, text, type }]);
  };

  // Scroll console to bottom
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Load companies status from backend
  const fetchCompaniesStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/companies-status`);
      if (!res.ok) throw new Error("Failed to load status");
      const data: CompanyStatus[] = await res.json();
      setCompanies(data);
    } catch (err: any) {
      console.error(err);
      addLog("Failed to connect to backend API server. Make sure it is running.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCompaniesStatus();
    addLog("Dashboard initialized. System ready.", "info");
  }, []);

  // Poll status when bulk scraping is active
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isBulkScraping) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/admin/scrape-status`);
          if (!res.ok) throw new Error("Failed to fetch progress status");
          const data = await res.json();
          
          setIsBulkScraping(data.isBulkScraping);
          const prog = data.progress;
          setProgress(prog);

          // Log progress updates
          if (prog.ticker && prog.ticker !== progress.ticker) {
            addLog(`Scraping started for: ${prog.ticker}`, "info");
          }

          // Compare completed lists to log successes
          prog.completed.forEach((ticker: string) => {
            if (!prevCompletedRef.current.includes(ticker)) {
              addLog(`Ingestion completed for ${ticker}`, "success");
              prevCompletedRef.current.push(ticker);
              // Update in-memory companies state status
              setCompanies((prev) =>
                prev.map((c) => (c.ticker === ticker ? { ...c, status: "Completed", lastUpdated: new Date().toISOString() } : c))
              );
            }
          });

          // Compare failed lists to log failures
          prog.failed.forEach((ticker: string) => {
            if (!prevFailedRef.current.includes(ticker)) {
              addLog(`Ingestion failed for ${ticker}. Check server logs.`, "error");
              prevFailedRef.current.push(ticker);
              setCompanies((prev) =>
                prev.map((c) => (c.ticker === ticker ? { ...c, status: "Failed" } : c))
              );
            }
          });

        } catch (err: any) {
          console.error("Progress polling failed:", err.message);
        }
      }, 3000);
    } else {
      // Scrape completed or idle, fetch once to sync all
      fetchCompaniesStatus();
    }

    return () => clearInterval(interval);
  }, [isBulkScraping]);

  // Trigger individual company scrape
  const handleSingleScrape = async (ticker: string) => {
    if (isBulkScraping) return;
    setActionLoading(ticker);
    addLog(`Manual sync triggered for: ${ticker}`, "info");
    
    // Update state to scraping
    setCompanies((prev) =>
      prev.map((c) => (c.ticker === ticker ? { ...c, status: "Scraping" as any } : c))
    );

    try {
      const res = await fetch(`${API_BASE}/admin/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });

      if (!res.ok) throw new Error("Single sync failed");
      const data = await res.json();
      
      addLog(`Scrape successful for ${ticker}`, "success");
      setCompanies((prev) =>
        prev.map((c) => (c.ticker === ticker ? { ...c, status: "Completed", lastUpdated: data.lastUpdated } : c))
      );
    } catch (err: any) {
      addLog(`Failed to scrape ${ticker}: ${err.message}`, "error");
      setCompanies((prev) =>
        prev.map((c) => (c.ticker === ticker ? { ...c, status: "Failed" } : c))
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Trigger bulk scrape
  const handleStartBulk = async () => {
    if (isBulkScraping) return;
    
    // Reset trackers
    prevCompletedRef.current = [];
    prevFailedRef.current = [];
    setLogs([]);
    addLog("Bulk ingestion triggered for top 100 NSE companies...", "warn");

    try {
      const res = await fetch(`${API_BASE}/admin/scrape-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Bulk request failed");
      const data = await res.json();
      
      addLog(`Asynchronous bulk ingestion worker launched for ${data.total} companies.`, "info");
      setIsBulkScraping(true);
    } catch (err: any) {
      addLog(`Failed to launch bulk scrape: ${err.message}`, "error");
    }
  };

  // Stop/Abort bulk scrape
  const handleStopBulk = async () => {
    if (!isBulkScraping) return;
    try {
      addLog("Sending abort request to background scraping worker...", "warn");
      const res = await fetch(`${API_BASE}/admin/scrape-stop`, {
        method: "POST",
      });
      if (res.ok) {
        addLog("Abort request sent successfully.", "info");
        setIsBulkScraping(false);
      }
    } catch (err: any) {
      addLog(`Abort request failed: ${err.message}`, "error");
    }
  };

  // Calculate statistics
  const totalCount = companies.length;
  const completedCount = companies.filter((c) => c.status === "Completed").length;
  const failedCount = companies.filter((c) => c.status === "Failed").length;
  const pendingCount = totalCount - completedCount - failedCount;

  const percentComplete = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  // Filter grid list
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = c.ticker.includes(searchQuery.toUpperCase());
    const matchesFilter =
      statusFilter === "All" ||
      (statusFilter === "Completed" && c.status === "Completed") ||
      (statusFilter === "Pending" && c.status === "Pending") ||
      (statusFilter === "Failed" && c.status === "Failed");
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center tracking-tight text-white">
              <Database className="w-8 h-8 mr-3 text-primary animate-pulse" />
              NSE Stock Ingestion Dashboard
            </h1>
            <p className="text-slate-400 mt-2">
              Collect and generate AI research contexts for Nifty 100 companies.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={fetchCompaniesStatus}
              variant="outline"
              className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
              disabled={loading || isBulkScraping}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh Tickers
            </Button>
            {isBulkScraping ? (
              <Button onClick={handleStopBulk} variant="destructive" className="shadow-lg hover:shadow-destructive/20">
                <Square className="w-4 h-4 mr-2" /> Abort Scrape
              </Button>
            ) : (
              <Button onClick={handleStartBulk} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Play className="w-4 h-4 mr-2" /> Start Bulk Scrape
              </Button>
            )}
          </div>
        </div>

        {/* Ingestion progress bar banner */}
        {isBulkScraping && (
          <Card className="border-primary/20 bg-slate-900/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-800">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${percentComplete}%` }}
              ></div>
            </div>
            <CardContent className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Ingestion In Progress ({percentComplete}%)</h3>
                  <p className="text-sm text-slate-400 mt-1 flex items-center">
                    Scraping data for <Badge variant="outline" className="ml-1.5 text-primary border-primary/30 bg-primary/5">{progress.ticker}</Badge>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-300">
                  {progress.current} / {progress.total} Companies Syncing
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Completed: {progress.completed.length} | Failed: {progress.failed.length}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Nifty 100 Companies", value: totalCount, desc: "Onboarded Tickers", color: "border-slate-800 bg-slate-900/40" },
            { label: "Ingested Reports", value: completedCount, desc: "Precomputed & Ready", color: "border-emerald-500/20 bg-emerald-950/10 text-emerald-400" },
            { label: "Pending Ingestion", value: pendingCount, desc: "Scrape Required", color: "border-amber-500/20 bg-amber-950/10 text-amber-400" },
            { label: "Failed Operations", value: failedCount, desc: "Need Admin Sync", color: "border-rose-500/20 bg-rose-950/10 text-rose-400" }
          ].map((stat) => (
            <Card key={stat.label} className={`border ${stat.color} shadow-lg backdrop-blur-md`}>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-400">{stat.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-white">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value}</div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center">
                  {stat.desc} <ArrowUpRight className="w-3 h-3 ml-1 opacity-50" />
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Logs terminal box */}
        <Card className="border-slate-800 bg-slate-950 shadow-inner">
          <CardHeader className="pb-3 border-b border-slate-900 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center text-slate-300">
              <Terminal className="w-4 h-4 mr-2 text-primary" /> Ingestion Logging Console
            </CardTitle>
            <Badge variant="outline" className="border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest bg-slate-900">
              Live stdout
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-44 overflow-y-auto font-mono text-xs space-y-2 bg-[#05080f] p-4 rounded border border-slate-900 text-slate-300 select-all scrollbar-thin">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic select-none">Console is quiet... trigger bulk ingestion to display active scraping operations.</div>
              ) : (
                logs.map((log, index) => {
                  let color = "text-slate-400";
                  if (log.type === "success") color = "text-emerald-400";
                  if (log.type === "error") color = "text-rose-400";
                  if (log.type === "warn") color = "text-amber-400";
                  return (
                    <div key={index} className="flex items-start leading-relaxed">
                      <span className="text-slate-600 select-none mr-2">[{log.timestamp}]</span>
                      <span className={color}>{log.text}</span>
                    </div>
                  );
                })
              )}
              <div ref={consoleEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Company Grid List */}
        <div className="space-y-4">
          
          {/* Controls, Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800/80">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search symbol (e.g. INFY)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#0b101c] border-slate-800 text-slate-200 placeholder-slate-600 focus:border-primary/50"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
              {(["All", "Completed", "Pending", "Failed"] as const).map((filter) => (
                <Button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  variant={statusFilter === filter ? "default" : "outline"}
                  size="sm"
                  className={`flex-shrink-0 text-xs font-semibold ${
                    statusFilter === filter
                      ? "bg-primary text-white"
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          {/* Companies badges list */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mr-3 text-primary" /> Loading company list...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-800/60 rounded-xl text-slate-600">
              No tickers matched the selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3.5">
              {filteredCompanies.map((c) => {
                let badgeClass = "border-slate-800 bg-slate-900/30 text-slate-500"; // Pending
                if (c.status === "Completed") badgeClass = "border-emerald-500/20 bg-emerald-950/10 text-emerald-400 hover:border-emerald-400/40";
                if (c.status === "Failed") badgeClass = "border-rose-500/20 bg-rose-950/10 text-rose-400 hover:border-rose-400/40";
                if (c.status === "Scraping") badgeClass = "border-primary/20 bg-primary/10 text-primary border-dashed animate-pulse";

                const isSyncing = actionLoading === c.ticker || c.status === "Scraping";

                return (
                  <div
                    key={c.ticker}
                    className={`border rounded-lg p-3 text-center flex flex-col items-center justify-between relative transition-all duration-300 ${badgeClass} shadow-md group`}
                  >
                    <div className="text-xs text-slate-500 uppercase tracking-widest select-none">NSE</div>
                    <div className="text-sm font-extrabold tracking-tight mt-1 text-white group-hover:text-primary transition-colors">
                      {c.ticker}
                    </div>

                    {/* Sync icon trigger */}
                    <div className="mt-2.5 flex items-center justify-center gap-1.5 w-full">
                      {c.status === "Completed" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      ) : c.status === "Failed" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                      ) : null}

                      {!isBulkScraping && (
                        <button
                          onClick={() => handleSingleScrape(c.ticker)}
                          disabled={isSyncing}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 ml-1 hover:text-white transition-all disabled:opacity-50 text-slate-400 hover:scale-110"
                          title="Ingest Ticker Now"
                        >
                          {isSyncing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Tooltip last sync date */}
                    {c.lastUpdated && (
                      <div className="absolute bottom-[-24px] left-[50%] translate-x-[-50%] bg-slate-900 border border-slate-800 text-[9px] text-slate-400 rounded px-1.5 py-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-all shadow-xl z-20 whitespace-nowrap">
                        Synced: {new Date(c.lastUpdated).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
