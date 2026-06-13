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
  Lock,
  LogOut,
  Check,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";

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
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Stock Ingestion State
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
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const prevCompletedRef = useRef<string[]>([]);
  const prevFailedRef = useRef<string[]>([]);

  // Check login on mount
  useEffect(() => {
    const token = localStorage.getItem("finguard_admin_token");
    if (token === "finguard_admin_authenticated") {
      setIsAuthenticated(true);
    }
  }, []);

  // Throw 404 if running in production
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  // Fetch stock statuses when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCompaniesStatus();
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("finguard_admin_token", data.token || "finguard_admin_authenticated");
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || "Authentication failed. Invalid credentials.");
      }
    } catch (err: any) {
      setLoginError("Failed to reach server. Ensure backend is running.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("finguard_admin_token");
    setIsAuthenticated(false);
    setPassword("");
  };

  // Log message helper
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
      setLoadingCompanies(true);
      const res = await fetch(`${API_BASE}/admin/companies-status`);
      if (!res.ok) throw new Error("Failed to load status");
      const data: CompanyStatus[] = await res.json();
      setCompanies(data);
    } catch (err: any) {
      console.error(err);
      addLog("Failed to connect to backend stock ingestion APIs.", "error");
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Poll progress when bulk scraping is active
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

          if (prog.ticker && prog.ticker !== progress.ticker) {
            addLog(`Scraping started for: ${prog.ticker}`, "info");
          }

          prog.completed.forEach((ticker: string) => {
            if (!prevCompletedRef.current.includes(ticker)) {
              addLog(`Ingestion completed for ${ticker}`, "success");
              prevCompletedRef.current.push(ticker);
              setCompanies((prev) =>
                prev.map((c) => (c.ticker === ticker ? { ...c, status: "Completed", lastUpdated: new Date().toISOString() } : c))
              );
            }
          });

          prog.failed.forEach((ticker: string) => {
            if (!prevFailedRef.current.includes(ticker)) {
              addLog(`Ingestion failed for ${ticker}`, "error");
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
      if (isAuthenticated) {
        fetchCompaniesStatus();
      }
    }

    return () => clearInterval(interval);
  }, [isBulkScraping, isAuthenticated]);

  // Trigger individual company scrape
  const handleSingleScrape = async (ticker: string) => {
    if (isBulkScraping) return;
    setActionLoading(ticker);
    addLog(`Manual sync triggered for: ${ticker}`, "info");
    
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
        prev.map((c) => (c.ticker === ticker ? { ...c, status: "Completed", lastUpdated: data.lastUpdated || new Date().toISOString() } : c))
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

  // Stop bulk scrape
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

  // Filter Stock Tickers list
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = c.ticker.toUpperCase().includes(searchQuery.toUpperCase());
    const matchesFilter =
      statusFilter === "All" ||
      (statusFilter === "Completed" && c.status === "Completed") ||
      (statusFilter === "Pending" && c.status === "Pending") ||
      (statusFilter === "Failed" && c.status === "Failed");
    return matchesSearch && matchesFilter;
  });

  // If not authenticated, render beautiful premium dark authentication portal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050506] text-slate-100 flex flex-col justify-center items-center py-20 px-4 relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none z-0"></div>
        <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

        <Card className="w-full max-w-md border-white/10 bg-slate-950/40 backdrop-blur-xl shadow-2xl relative z-10 p-4">
          <CardHeader className="text-center space-y-3">
            <div className="bg-violet-600/15 text-violet-400 p-3.5 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
              <Lock className="h-6 w-6 animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-white tracking-tight">Admin Authentication</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Access stock ingestion controls and report generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-400">Admin Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username..."
                  className="bg-[#0c0d12] border-white/10 text-white placeholder-slate-600 focus:border-violet-500 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-400">Admin Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter system secret key..."
                  className="bg-[#0c0d12] border-white/10 text-white placeholder-slate-600 focus:border-violet-500 rounded-xl"
                  required
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 text-red-400 text-xs p-3 rounded-xl">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-11 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" /> Verifying Credentials...
                  </>
                ) : (
                  <>
                    Unlock Console <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-white/5 pt-4 mt-6">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              FinGuard AI Secure Portal
            </span>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] text-slate-100 py-10 px-4 md:px-8 relative overflow-x-hidden">
      <div className="absolute top-0 right-[-100px] w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[180px] pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Portal Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold flex items-center tracking-tight text-white gap-2">
              <Database className="w-8 h-8 text-violet-500" />
              Stock Ingestion Console
            </h1>
            <p className="text-xs text-slate-400">
              Manage stock report ingestions, sync data, and configure background crawlers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-xs h-9 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
            </Button>
          </div>
        </header>

        {/* Ingestion progress bar banner */}
        {isBulkScraping && (
          <Card className="border-primary/20 bg-slate-900/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-800">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%` }}
              ></div>
            </div>
            <CardContent className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Ingestion In Progress</h3>
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
            { label: "Nifty 100 Companies", value: companies.length, desc: "Onboarded Tickers", color: "border-slate-800 bg-slate-900/40" },
            { label: "Ingested Reports", value: companies.filter((c) => c.status === "Completed").length, desc: "Ready for Analysis", color: "border-emerald-500/20 bg-emerald-950/10 text-emerald-400" },
            { label: "Pending Ingestion", value: companies.filter((c) => c.status !== "Completed" && c.status !== "Failed").length, desc: "Scrape Required", color: "border-amber-500/20 bg-amber-950/10 text-amber-400" },
            { label: "Failed Operations", value: companies.filter((c) => c.status === "Failed").length, desc: "Need Admin Sync", color: "border-rose-500/20 bg-rose-950/10 text-rose-400" }
          ].map((stat) => (
            <Card key={stat.label} className={`border ${stat.color} shadow-lg backdrop-blur-md text-left`}>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-400">{stat.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-white">{loadingCompanies ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value}</div>
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
            <div className="h-44 overflow-y-auto font-mono text-xs space-y-2 bg-[#05080f] p-4 rounded border border-slate-900 text-slate-300 select-all scrollbar-thin text-left">
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
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800/65"
                  }`}
                >
                  {filter}
                </Button>
              ))}
              <div className="border-l border-slate-800 h-6 mx-2 hidden sm:block"></div>
              {isBulkScraping ? (
                <Button onClick={handleStopBulk} variant="destructive" size="sm" className="shadow-lg hover:shadow-destructive/20 h-8 text-xs cursor-pointer">
                  <Square className="w-3.5 h-3.5 mr-1" /> Abort Bulk
                </Button>
              ) : (
                <Button onClick={handleStartBulk} size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-lg h-8 text-xs cursor-pointer">
                  <Play className="w-3.5 h-3.5 mr-1" /> Bulk Scrape
                </Button>
              )}
            </div>
          </div>

          {/* Companies badges list */}
          {loadingCompanies ? (
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
                let badgeClass = "border-slate-800 bg-slate-900/30 text-slate-500";
                if (c.status === "Completed") badgeClass = "border-emerald-500/20 bg-emerald-950/10 text-emerald-400 hover:border-emerald-400/40";
                if (c.status === "Failed") badgeClass = "border-rose-500/20 bg-rose-950/10 text-rose-400 hover:border-rose-400/40";
                if (c.status === "Scraping") badgeClass = "border-primary/20 bg-primary/10 text-primary border-dashed animate-pulse";

                const isSyncing = actionLoading === c.ticker || c.status === "Scraping";

                return (
                  <div
                    key={c.ticker}
                    className={`border rounded-lg p-3 text-center flex flex-col items-center justify-between relative transition-all duration-300 ${badgeClass} shadow-md group`}
                  >
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest select-none">NSE</div>
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
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 ml-1 hover:text-white transition-all disabled:opacity-50 text-slate-400 hover:scale-110 cursor-pointer"
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
