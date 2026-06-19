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
  Trash2,
  Calendar,
  Video,
  Users,
  PlusCircle,
  Cpu,
  FileText,
  FileJson,
  Zap,
  Settings
} from "lucide-react";

const API_BASE = (import.meta as any).env.VITE_API_URL || "http://localhost:5001";

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

// ─── Simple Replicated UI Components ─────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'destructive', size?: 'default' | 'sm' | 'lg' }>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    let baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
    
    let variantStyles = 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold';
    if (variant === 'outline') {
      variantStyles = 'border border-gray-700 bg-slate-900 text-white hover:bg-slate-800';
    } else if (variant === 'destructive') {
      variantStyles = 'bg-rose-600 text-white hover:bg-rose-700 font-bold';
    }

    let sizeStyles = 'h-10 py-2 px-4';
    if (size === 'sm') {
      sizeStyles = 'h-8 px-3 text-xs rounded-lg';
    } else if (size === 'lg') {
      sizeStyles = 'h-11 px-8 rounded-lg';
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={`flex h-10 w-full rounded-lg border border-gray-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export function Card({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-gray-800 bg-slate-900/60 text-white shadow-md backdrop-blur-xl ${className}`} {...props} />;
}

export function CardHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-xl font-extrabold tracking-tight text-white ${className}`} {...props} />;
}

export function CardDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-xs text-gray-400 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 pt-0 ${className}`} {...props} />;
}

export function CardFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />;
}

export function Badge({ className = '', variant = 'default', ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }) {
  let baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider';
  let variantStyles = 'border-transparent bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (variant === 'secondary') {
    variantStyles = 'border-transparent bg-gray-850 text-gray-300';
  } else if (variant === 'destructive') {
    variantStyles = 'border-transparent bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (variant === 'outline') {
    variantStyles = 'text-gray-400 border-gray-700';
  }
  return <span className={`${baseStyles} ${variantStyles} ${className}`} {...props} />;
}

// ─── Main AdminDashboard Component ──────────────────────────────────────────

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

  // Webinars Panel State
  const [activePanel, setActivePanel] = useState<"stocks" | "webinars" | "system">("stocks");
  const [webinars, setWebinars] = useState<any[]>([]);
  const [webinarsLoading, setWebinarsLoading] = useState(false);
  const [showWebinarForm, setShowWebinarForm] = useState(false);
  
  // Create Webinar Form Fields
  const [wTitle, setWTitle] = useState("");
  const [wSpeaker, setWSpeaker] = useState("");
  const [wDescription, setWDescription] = useState("");
  const [wStartTime, setWStartTime] = useState("");
  const [wEndTime, setWEndTime] = useState("");
  const [wZoomLink, setWZoomLink] = useState("");
  const [wType, setWType] = useState<"FREE" | "PREMIUM">("FREE");
  const [webinarActionLoading, setWebinarActionLoading] = useState(false);

  // System Operations State
  const [pdfSymbol, setPdfSymbol] = useState("");
  const [pdfIsin, setPdfIsin] = useState("");
  const [pdfDryRun, setPdfDryRun] = useState(false);
  const [aiTicker, setAiTicker] = useState("");
  const [aiForce, setAiForce] = useState(false);
  const [customTicker, setCustomTicker] = useState("");
  
  const [ingestionLoading, setIngestionLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [vectorsLoading, setVectorsLoading] = useState(false);
  const [pdfScrapeLoading, setPdfScrapeLoading] = useState(false);
  const [aiReportLoading, setAiReportLoading] = useState(false);

  // Check login on mount
  useEffect(() => {
    const token = localStorage.getItem("finguard_admin_token");
    if (token === "finguard_admin_authenticated") {
      setIsAuthenticated(true);
    }
  }, []);

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
      setLoginError("Failed to reach server. Ensure admin service backend is running.");
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

  // Fetch webinars
  const fetchAdminWebinars = async () => {
    try {
      setWebinarsLoading(true);
      const res = await fetch(`${API_BASE}/admin/webinars`);
      if (!res.ok) throw new Error("Failed to load webinars");
      const data = await res.json();
      setWebinars(data);
    } catch (err: any) {
      addLog(`Failed to fetch webinars: ${err.message}`, "error");
    } finally {
      setWebinarsLoading(false);
    }
  };

  // Trigger webinars load when switching tabs
  useEffect(() => {
    if (isAuthenticated && activePanel === "webinars") {
      fetchAdminWebinars();
    }
  }, [isAuthenticated, activePanel]);

  // Create webinar
  const handleCreateWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wTitle || !wSpeaker || !wStartTime || !wEndTime || !wZoomLink) {
      addLog("Please fill in all required webinar details", "error");
      return;
    }
    setWebinarActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/webinars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: wTitle,
          speaker: wSpeaker,
          description: wDescription,
          startTime: new Date(wStartTime).toISOString(),
          endTime: new Date(wEndTime).toISOString(),
          zoomLink: wZoomLink,
          type: wType
        })
      });
      if (!res.ok) throw new Error("Creation failed");
      addLog(`Created webinar: "${wTitle}"`, "success");
      // Reset form
      setWTitle("");
      setWSpeaker("");
      setWDescription("");
      setWStartTime("");
      setWEndTime("");
      setWZoomLink("");
      setWType("FREE");
      setShowWebinarForm(false);
      fetchAdminWebinars();
    } catch (err: any) {
      addLog(`Failed to create webinar: ${err.message}`, "error");
    } finally {
      setWebinarActionLoading(false);
    }
  };

  // Delete webinar
  const handleDeleteWebinar = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/webinars/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Deletion failed");
      addLog(`Deleted webinar: "${title}"`, "success");
      fetchAdminWebinars();
    } catch (err: any) {
      addLog(`Failed to delete webinar: ${err.message}`, "error");
    }
  };

  // System Operations Handlers
  const handleTriggerIngestion = async () => {
    setIngestionLoading(true);
    addLog("Triggering Daily Ingestion Job manually...", "info");
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/trigger-ingestion`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(data.message || "Daily Ingestion Job successfully triggered in background.", "success");
      } else {
        addLog(data.error || "Failed to trigger Daily Ingestion Job.", "error");
      }
    } catch (err: any) {
      addLog(`Error triggering Daily Ingestion Job: ${err.message}`, "error");
    } finally {
      setIngestionLoading(false);
    }
  };

  const handleTriggerMetrics = async () => {
    setMetricsLoading(true);
    addLog("Triggering Screener Metrics Calculation Job manually...", "info");
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/trigger-metrics`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(data.message || "Screener Metrics Job successfully triggered in background.", "success");
      } else {
        addLog(data.error || "Failed to trigger Screener Metrics Job.", "error");
      }
    } catch (err: any) {
      addLog(`Error triggering Screener Metrics Job: ${err.message}`, "error");
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleTriggerVectors = async () => {
    setVectorsLoading(true);
    addLog("Triggering Pattern Vector Ingestion Job manually...", "info");
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/trigger-vectors`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(data.message || "Pattern Vector Job successfully triggered in background.", "success");
      } else {
        addLog(data.error || "Failed to trigger Pattern Vector Job.", "error");
      }
    } catch (err: any) {
      addLog(`Error triggering Pattern Vector Job: ${err.message}`, "error");
    } finally {
      setVectorsLoading(false);
    }
  };

  const handlePdfScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfSymbol) {
      addLog("Stock Symbol is required for PDF scraping", "error");
      return;
    }
    setPdfScrapeLoading(true);
    addLog(`Triggering Annual Report scraping & processing for ${pdfSymbol.toUpperCase()}...`, "info");
    try {
      const res = await fetch(`${API_BASE}/admin/annual-report/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: pdfSymbol.toUpperCase().trim(),
          isin: pdfIsin.trim() || undefined,
          dryRun: pdfDryRun
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(data.message || `Annual report processing started for ${pdfSymbol.toUpperCase()}`, "success");
        setPdfSymbol("");
        setPdfIsin("");
      } else {
        addLog(data.error || "Failed to trigger Annual Report scraping.", "error");
      }
    } catch (err: any) {
      addLog(`Error triggering Annual Report scraping: ${err.message}`, "error");
    } finally {
      setPdfScrapeLoading(false);
    }
  };

  const handleAiReportGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTicker) {
      addLog("Stock Ticker is required for AI Report generation", "error");
      return;
    }
    setAiReportLoading(true);
    addLog(`Triggering AI Report generation for ${aiTicker.toUpperCase()}...`, "info");
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: aiTicker.toUpperCase().trim(),
          force: aiForce
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(data.message || `AI Report generation started for ${aiTicker.toUpperCase()}`, "success");
        setAiTicker("");
      } else {
        addLog(data.error || "Failed to trigger AI Report generation.", "error");
      }
    } catch (err: any) {
      addLog(`Error triggering AI Report generation: ${err.message}`, "error");
    } finally {
      setAiReportLoading(false);
    }
  };

  // Poll progress when bulk scraping is active
  useEffect(() => {
    let interval: any;

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

  // If not authenticated, render premium authentication portal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-gray-150 flex flex-col justify-center items-center py-20 px-4 relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none z-0"></div>
        <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

        <Card className="w-full max-w-md border-gray-800 bg-slate-900/60 backdrop-blur-xl shadow-md p-4 relative z-10">
          <CardHeader className="text-center space-y-3">
            <div className="bg-amber-500/15 text-amber-400 p-3.5 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
              <Lock className="h-6 w-6 animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-white">Admin Authentication</CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Access stock ingestion controls and report generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-gray-400">Admin Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username..."
                  className="bg-slate-950 border-gray-800 text-white placeholder-gray-500 focus-visible:ring-amber-500 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-gray-400">Admin Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter system secret key..."
                  className="bg-slate-950 border-gray-800 text-white placeholder-gray-500 focus-visible:ring-amber-500 rounded-xl"
                  required
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 border border-rose-500/25 bg-rose-500/5 text-rose-400 text-xs p-3 rounded-xl">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-11 rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    Unlock Console <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-gray-800 pt-4 mt-6">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
              FinGuard AI Secure Portal
            </span>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 py-10 px-4 md:px-8 relative overflow-x-hidden">
      <div className="absolute top-0 right-[-100px] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[180px] pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Portal Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-6 gap-4">
          <div className="space-y-1 text-left">
            <h1 className="text-3xl font-extrabold flex items-center tracking-tight text-white gap-2">
              <Database className="w-8 h-8 text-amber-500" />
              FinGuard Management Console
            </h1>
            <p className="text-xs text-gray-400">
              Configure stock reports, ingestions, live webinars, access control rules, and settings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-gray-800 bg-slate-900 text-white hover:bg-slate-800 text-xs h-9 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
            </Button>
          </div>
        </header>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-800 pb-1">
          <button
            onClick={() => setActivePanel("stocks")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activePanel === "stocks"
                ? "border-amber-500 text-white font-extrabold"
                : "border-transparent text-gray-450 hover:text-white"
            }`}
          >
            Stock Ingestions
          </button>
          <button
            onClick={() => setActivePanel("webinars")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activePanel === "webinars"
                ? "border-amber-500 text-white font-extrabold"
                : "border-transparent text-gray-450 hover:text-white"
            }`}
          >
            Webinars & Events
          </button>
          <button
            onClick={() => setActivePanel("system")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activePanel === "system"
                ? "border-amber-500 text-white font-extrabold"
                : "border-transparent text-gray-450 hover:text-white"
            }`}
          >
            System Operations
          </button>
        </div>

        {activePanel === "stocks" && (
          <>
            {/* Ingestion progress bar banner */}
            {isBulkScraping && (
              <Card className="border-gray-800 bg-slate-900/60 backdrop-blur-xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-850">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%` }}
                  ></div>
                </div>
                <CardContent className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-amber-500/10 p-3 rounded-full">
                      <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-lg text-white">Ingestion In Progress</h3>
                      <p className="text-sm text-gray-400 mt-1 flex items-center">
                        Scraping data for <Badge variant="outline" className="ml-1.5 text-amber-400 border-amber-500/30 bg-amber-500/5">{progress.ticker}</Badge>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">
                      {progress.current} / {progress.total} Companies Syncing
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Completed: {progress.completed.length} | Failed: {progress.failed.length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Nifty 100 Companies", value: companies.length, desc: "Onboarded Tickers", color: "border-gray-800 bg-slate-900/60" },
                { label: "Ingested Reports", value: companies.filter((c) => c.status === "Completed").length, desc: "Ready for Analysis", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
                { label: "Pending Ingestion", value: companies.filter((c) => c.status !== "Completed" && c.status !== "Failed").length, desc: "Scrape Required", color: "border-amber-500/20 bg-amber-500/5 text-amber-400" },
                { label: "Failed Operations", value: companies.filter((c) => c.status === "Failed").length, desc: "Need Admin Sync", color: "border-rose-500/20 bg-rose-500/5 text-rose-400" }
              ].map((stat) => (
                <Card key={stat.label} className={`border ${stat.color} shadow-sm backdrop-blur-md text-left`}>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-white">{loadingCompanies ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value}</div>
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center">
                      {stat.desc} <ArrowUpRight className="w-3 h-3 ml-1 opacity-50" />
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Logs terminal box */}
            <Card className="border-gray-800 bg-slate-900/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-800 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center text-white">
                  <Terminal className="w-4 h-4 mr-2 text-amber-500" /> Ingestion Logging Console
                </CardTitle>
                <Badge variant="outline" className="border-gray-850 text-[10px] text-gray-400 bg-slate-950">
                  Live stdout
                </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-44 overflow-y-auto font-mono text-xs space-y-2 bg-slate-950/70 p-4 rounded border border-gray-850 text-white select-all scrollbar-thin text-left">
                  {logs.length === 0 ? (
                    <div className="text-gray-500 italic select-none">Console is quiet... trigger bulk ingestion to display active scraping operations.</div>
                  ) : (
                    logs.map((log, index) => {
                      let color = "text-gray-400";
                      if (log.type === "success") color = "text-emerald-400";
                      if (log.type === "error") color = "text-rose-400";
                      if (log.type === "warn") color = "text-amber-400";
                      return (
                        <div key={index} className="flex items-start leading-relaxed">
                          <span className="text-gray-600 select-none mr-2">[{log.timestamp}]</span>
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
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-gray-800">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search symbol (e.g. INFY)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-slate-950 border-gray-800 text-white placeholder-gray-500 focus-visible:ring-amber-500"
                    />
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (customTicker.trim()) {
                      handleSingleScrape(customTicker.toUpperCase().trim());
                      setCustomTicker("");
                    }
                  }} className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                      placeholder="Enter new ticker..."
                      value={customTicker}
                      onChange={(e) => setCustomTicker(e.target.value)}
                      className="bg-slate-950 border-gray-800 text-white placeholder-gray-500 focus-visible:ring-amber-500 h-10 w-full sm:w-40"
                    />
                    <Button type="submit" disabled={isBulkScraping || actionLoading !== null} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10 px-3 flex-shrink-0">
                      Scrape Ticker
                    </Button>
                  </form>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <Filter className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  {(["All", "Completed", "Pending", "Failed"] as const).map((filter) => (
                    <Button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      variant={statusFilter === filter ? "default" : "outline"}
                      size="sm"
                      className={`flex-shrink-0 text-xs font-semibold ${
                        statusFilter === filter
                          ? "bg-amber-500 text-slate-950 hover:bg-amber-600"
                          : "border-gray-800 bg-slate-900 text-gray-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {filter}
                    </Button>
                  ))}
                  <div className="border-l border-gray-800 h-6 mx-2 hidden sm:block"></div>
                  {isBulkScraping ? (
                    <Button onClick={handleStopBulk} variant="destructive" size="sm" className="shadow-lg h-8 text-xs cursor-pointer">
                      <Square className="w-3.5 h-3.5 mr-1" /> Abort Bulk
                    </Button>
                  ) : (
                    <Button onClick={handleStartBulk} size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm h-8 text-xs cursor-pointer">
                      <Play className="w-3.5 h-3.5 mr-1" /> Bulk Scrape
                    </Button>
                  )}
                </div>
              </div>

              {/* Companies badges list */}
              {loadingCompanies ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mr-3 text-amber-500" /> Loading company list...
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-xl text-gray-400">
                  No tickers matched the selected filters.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3.5">
                  {filteredCompanies.map((c) => {
                    let badgeClass = "border-gray-800 bg-slate-900/60 text-gray-400";
                    if (c.status === "Completed") badgeClass = "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:border-emerald-400/40";
                    if (c.status === "Failed") badgeClass = "border-rose-500/20 bg-rose-500/5 text-rose-400 hover:border-rose-450/40";
                    if (c.status === "Scraping") badgeClass = "border-amber-500/20 bg-amber-500/10 text-amber-455 border-dashed animate-pulse";

                    const isSyncing = actionLoading === c.ticker || c.status === "Scraping";

                    return (
                      <div
                        key={c.ticker}
                        className={`border rounded-lg p-3 text-center flex flex-col items-center justify-between relative transition-all duration-300 ${badgeClass} shadow-sm group`}
                      >
                        <div className="text-[9px] text-gray-500 uppercase tracking-widest select-none">NSE</div>
                        <div className="text-sm font-extrabold tracking-tight mt-1 text-white group-hover:text-amber-400 transition-colors">
                          {c.ticker}
                        </div>

                        {/* Sync icon trigger */}
                        <div className="mt-2.5 flex items-center justify-center gap-1.5 w-full">
                          {c.status === "Completed" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : c.status === "Failed" ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          ) : null}

                          {!isBulkScraping && (
                            <button
                               onClick={() => handleSingleScrape(c.ticker)}
                               disabled={isSyncing}
                               className="opacity-0 group-hover:opacity-100 focus:opacity-100 ml-1 hover:text-white transition-all disabled:opacity-50 text-gray-500 hover:scale-110 cursor-pointer"
                               title="Ingest Ticker Now"
                            >
                              {isSyncing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Tooltip last sync date */}
                        {c.lastUpdated && (
                          <div className="absolute bottom-[-24px] left-[50%] translate-x-[-50%] bg-slate-900 border border-gray-800 text-[9px] text-white rounded px-1.5 py-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-all shadow-xl z-20 whitespace-nowrap">
                            Synced: {new Date(c.lastUpdated).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activePanel === "webinars" && (
          <div className="space-y-6 text-left">
            
            {/* Create Webinar Collapsible panel */}
            <Card className="border-gray-800 bg-slate-900/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center text-white">
                    <Video className="w-4 h-4 mr-2 text-amber-500 animate-pulse" /> Webinar Scheduling Center
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-400 mt-0.5">
                    Schedule classes, set Zoom links, and configure access roles.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowWebinarForm(!showWebinarForm)}
                  variant="outline"
                  size="sm"
                  className="border-gray-800 bg-slate-950 text-white hover:text-white text-xs cursor-pointer rounded-lg"
                >
                  {showWebinarForm ? "Collapse Form" : "Create New Webinar"}
                </Button>
              </CardHeader>
              
              {showWebinarForm && (
                <CardContent className="pt-5 border-b border-gray-800">
                  <form onSubmit={handleCreateWebinar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">Webinar Title *</label>
                      <Input
                        value={wTitle}
                        onChange={(e) => setWTitle(e.target.value)}
                        placeholder="e.g., Options Trading Strategies"
                        className="bg-slate-950 border-gray-800 text-white placeholder-gray-500 focus-visible:ring-amber-500 text-xs"
                        required
                      />
                    </div>

                    {/* Speaker */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">Expert Speaker *</label>
                      <Input
                        value={wSpeaker}
                        onChange={(e) => setWSpeaker(e.target.value)}
                        placeholder="e.g., Abhijeet Trivedi"
                        className="bg-slate-950 border-gray-800 text-white placeholder-gray-500 focus-visible:ring-amber-500 text-xs"
                        required
                      />
                    </div>

                    {/* Start Time */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">Start Time (Local) *</label>
                      <Input
                        type="datetime-local"
                        value={wStartTime}
                        onChange={(e) => setWStartTime(e.target.value)}
                        className="bg-slate-950 border-gray-800 text-white focus-visible:ring-amber-500 text-xs"
                        required
                      />
                    </div>

                    {/* End Time */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">End Time (Local) *</label>
                      <Input
                        type="datetime-local"
                        value={wEndTime}
                        onChange={(e) => setWEndTime(e.target.value)}
                        className="bg-slate-950 border-gray-800 text-white focus-visible:ring-amber-500 text-xs"
                        required
                      />
                    </div>

                    {/* Zoom Link */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold text-gray-400">Zoom Meeting URL *</label>
                      <Input
                        type="url"
                        value={wZoomLink}
                        onChange={(e) => setWZoomLink(e.target.value)}
                        placeholder="https://zoom.us/j/meeting_id"
                        className="bg-slate-950 border-gray-800 text-white placeholder-gray-500 focus-visible:ring-amber-500 text-xs"
                        required
                      />
                    </div>

                    {/* Type Selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">Access Restriction Tier *</label>
                      <select
                        value={wType}
                        onChange={(e) => setWType(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-lg border border-gray-800 bg-slate-950 text-white text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-550"
                      >
                        <option value="FREE">FREE FOR EVERYONE</option>
                        <option value="PREMIUM">PREMIUM ONLY (PAID SUBSCRIBERS)</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold text-gray-400">Description / Agenda</label>
                      <textarea
                        value={wDescription}
                        onChange={(e) => setWDescription(e.target.value)}
                        placeholder="Detail the webinar agenda and structure here..."
                        rows={3}
                        className="w-full p-3 rounded-lg border border-gray-800 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-500"
                      />
                    </div>

                    <div className="md:col-span-2 pt-2 flex justify-end">
                      <Button
                        type="submit"
                        disabled={webinarActionLoading}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-9 text-xs rounded-lg cursor-pointer"
                      >
                        {webinarActionLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Scheduling...
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Schedule Event
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              )}
            </Card>

            {/* Webinars List Table */}
            <Card className="border-gray-800 bg-slate-900/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-800">
                <CardTitle className="text-sm font-bold flex items-center text-white">
                  <Calendar className="w-4 h-4 mr-2 text-amber-500" /> Active Scheduled Webinars
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {webinarsLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <Loader2 className="w-5 h-5 animate-spin mr-2 text-amber-500" /> Syncing Webinars Database...
                  </div>
                ) : webinars.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-gray-850 text-gray-400 text-xs bg-slate-950/20">
                    No webinars currently scheduled. Click 'Create New Webinar' above to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded border border-gray-800">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-800">
                          <th className="p-3">Title / Agenda</th>
                          <th className="p-3">Speaker</th>
                          <th className="p-3">Schedule</th>
                          <th className="p-3 text-center">Tier</th>
                          <th className="p-3 text-center">Registered</th>
                          <th className="p-3">Meeting link</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {webinars.map((w) => (
                          <tr key={w.id} className="border-b border-gray-850 hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 font-semibold text-white max-w-[200px] truncate" title={w.description}>
                              {w.title}
                            </td>
                            <td className="p-3 font-mono font-medium text-white">{w.speaker}</td>
                            <td className="p-3 text-gray-450">
                              {new Date(w.startTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            </td>
                            <td className="p-3 text-center">
                              {w.type === "PREMIUM" ? (
                                <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] uppercase tracking-wider">
                                  PREMIUM
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase tracking-wider">
                                  FREE
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-white">
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-amber-500" /> {w._count?.registrations || 0}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-amber-400 hover:underline max-w-[150px] truncate">
                              <a href={w.zoomLink} target="_blank" rel="noopener noreferrer">
                                {w.zoomLink}
                              </a>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteWebinar(w.id, w.title)}
                                className="text-rose-500 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                                title="Delete Webinar"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}

        {activePanel === "system" && (
          <div className="space-y-6 text-left">
            {/* Header / Intro */}
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500" />
                Heavy Computation & Jobs Control
              </h2>
              <p className="text-xs text-gray-400">
                Trigger background stock calculations, scrape annual reports, and generate AI insights. All operations run on the dedicated admin service.
              </p>
            </div>

            {/* Ingestion & Calculations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Job Triggers Card */}
              <Card className="border-gray-800 bg-slate-900/60 shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-gray-800">
                  <CardTitle className="text-sm font-bold flex items-center text-white">
                    <Cpu className="w-4 h-4 mr-2 text-amber-500" /> Background Cron Jobs
                  </CardTitle>
                  <CardDescription className="text-[11px] text-gray-400">
                    Manually execute heavy scheduled calculation routines.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-5 flex-1">
                  
                  {/* Daily Ingestion */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Daily Candle Ingestion</span>
                      <Badge variant="outline" className="text-[9px] text-gray-400 border-gray-800 bg-slate-950">Yahoo Finance</Badge>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Fetch the latest daily OHLCV candles for all onboarded stocks and update databases.
                    </p>
                    <Button
                      onClick={handleTriggerIngestion}
                      disabled={ingestionLoading}
                      size="sm"
                      className="w-full flex items-center justify-center gap-1.5 h-9"
                    >
                      {ingestionLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ingesting...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> Start Daily Ingestion
                        </>
                      )}
                    </Button>
                  </div>

                  <hr className="border-gray-800" />

                  {/* Screener Metrics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Screener Metrics</span>
                      <Badge variant="outline" className="text-[9px] text-gray-400 border-gray-800 bg-slate-950">Technical Indicators</Badge>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Recalculate key screener values (SMA, EMA, RSI, MACD, and technical score) across the board.
                    </p>
                    <Button
                      onClick={handleTriggerMetrics}
                      disabled={metricsLoading}
                      size="sm"
                      className="w-full flex items-center justify-center gap-1.5 h-9"
                    >
                      {metricsLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" /> Compute Screener Metrics
                        </>
                      )}
                    </Button>
                  </div>

                  <hr className="border-gray-800" />

                  {/* Pattern Vectors */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Pattern Vector Caching</span>
                      <Badge variant="outline" className="text-[9px] text-gray-400 border-gray-800 bg-slate-950">Precomputations</Badge>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Precompute pattern search vector embeddings to enable instant client-facing similarity query searches.
                    </p>
                    <Button
                      onClick={handleTriggerVectors}
                      disabled={vectorsLoading}
                      size="sm"
                      className="w-full flex items-center justify-center gap-1.5 h-9"
                    >
                      {vectorsLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Vectorizing...
                        </>
                      ) : (
                        <>
                          <Database className="w-3.5 h-3.5" /> Rebuild Pattern Vectors
                        </>
                      )}
                    </Button>
                  </div>

                </CardContent>
              </Card>

              {/* Annual Report Scraping Card */}
              <Card className="border-gray-800 bg-slate-900/60 shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-gray-800">
                  <CardTitle className="text-sm font-bold flex items-center text-white">
                    <FileText className="w-4 h-4 mr-2 text-amber-500" /> PDF Annual Report Scraper
                  </CardTitle>
                  <CardDescription className="text-[11px] text-gray-400">
                    Fetch PDF, scrape financial text, and extract structural summaries.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <form onSubmit={handlePdfScrape} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400">Stock Symbol / Ticker *</label>
                      <Input
                        value={pdfSymbol}
                        onChange={(e) => setPdfSymbol(e.target.value)}
                        placeholder="e.g., TCS"
                        className="bg-slate-950 border-gray-800 text-white placeholder-gray-500 focus-visible:ring-amber-500 text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400">ISIN Code (Optional)</label>
                      <Input
                        value={pdfIsin}
                        onChange={(e) => setPdfIsin(e.target.value)}
                        placeholder="e.g., INE467B01029"
                        className="bg-slate-950 border-gray-800 text-white placeholder-gray-500 focus-visible:ring-amber-500 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-2">
                      <input
                        type="checkbox"
                        id="pdfDryRun"
                        checked={pdfDryRun}
                        onChange={(e) => setPdfDryRun(e.target.checked)}
                        className="rounded border-gray-800 bg-slate-950 text-amber-500 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor="pdfDryRun" className="text-xs text-gray-400 cursor-pointer select-none">
                        Dry Run (fetch metadata without downloading/parsing PDF)
                      </label>
                    </div>

                    <Button
                      type="submit"
                      disabled={pdfScrapeLoading}
                      className="w-full flex items-center justify-center gap-1.5 h-9 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      {pdfScrapeLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scraping...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> Start Report Scraping
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* AI Report Generator Card */}
              <Card className="border-gray-800 bg-slate-900/60 shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-gray-800">
                  <CardTitle className="text-sm font-bold flex items-center text-white">
                    <FileJson className="w-4 h-4 mr-2 text-amber-500" /> AI Report Generator
                  </CardTitle>
                  <CardDescription className="text-[11px] text-gray-400">
                    Generate comprehensive financial analysis reports using AI models.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <form onSubmit={handleAiReportGenerate} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400">Stock Ticker *</label>
                      <Input
                        value={aiTicker}
                        onChange={(e) => setAiTicker(e.target.value)}
                        placeholder="e.g., RELIANCE"
                        className="bg-slate-950 border-gray-800 text-white placeholder-gray-500 focus-visible:ring-amber-500 text-xs"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 py-2">
                      <input
                        type="checkbox"
                        id="aiForce"
                        checked={aiForce}
                        onChange={(e) => setAiForce(e.target.checked)}
                        className="rounded border-gray-800 bg-slate-950 text-amber-500 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor="aiForce" className="text-xs text-gray-400 cursor-pointer select-none">
                        Force Regenerate (bypass cached reports)
                      </label>
                    </div>

                    <Button
                      type="submit"
                      disabled={aiReportLoading}
                      className="w-full flex items-center justify-center gap-1.5 h-9 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      {aiReportLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> Generate AI Report
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

            </div>

            {/* Shared Ingestion Logging Console */}
            <Card className="border-gray-800 bg-slate-900/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-800 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center text-white">
                  <Terminal className="w-4 h-4 mr-2 text-amber-500" /> Operations Log Console
                </CardTitle>
                <Badge variant="outline" className="border-gray-850 text-[10px] text-gray-400 bg-slate-950">
                  Live stdout
                </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-44 overflow-y-auto font-mono text-xs space-y-2 bg-slate-950/70 p-4 rounded border border-gray-850 text-white select-all scrollbar-thin text-left">
                  {logs.length === 0 ? (
                    <div className="text-gray-500 italic select-none">Console is quiet... trigger jobs to display active operations.</div>
                  ) : (
                    logs.map((log, index) => {
                      let color = "text-gray-400";
                      if (log.type === "success") color = "text-emerald-400";
                      if (log.type === "error") color = "text-rose-400";
                      if (log.type === "warn") color = "text-amber-400";
                      return (
                        <div key={index} className="flex items-start leading-relaxed">
                          <span className="text-gray-600 select-none mr-2">[{log.timestamp}]</span>
                          <span className={color}>{log.text}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
