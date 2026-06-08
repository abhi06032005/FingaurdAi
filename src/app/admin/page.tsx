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
  ShieldAlert,
  FileText,
  Plus,
  Eye,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Activity,
  User,
  Phone,
  Mail,
  LogOut,
  Check,
  AlertTriangle,
  Trash2,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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

interface ScamReport {
  id: string;
  scamType: string;
  lossRange: string;
  description: string;
  evidenceUrl: string | null;
  name: string;
  phone: string;
  email: string;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
}

interface Story {
  id: string;
  reportId: string;
  title: string;
  summary: string;
  published: boolean;
  createdAt: string;
}

interface ScamAlert {
  id: string;
  title: string;
  description: string;
  riskLevel: string; // High, Medium, Low
  status: string; // under_investigation, verified, closed
  createdAt: string;
}

interface Statistics {
  totalVictims: number;
  totalLosses: number;
  verifiedReports: number;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  reported: boolean;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

export default function AdminDashboard() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // General App State
  const [activeTab, setActiveTab] = useState<"stocks" | "reports" | "stories" | "alerts" | "stats" | "comments">("reports");
  
  // 1. Stock Ingestion State
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

  // 2. Reports State
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScamReport | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);

  // 3. Story Publisher State
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [newStoryReportId, setNewStoryReportId] = useState("");
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStorySummary, setNewStorySummary] = useState("");
  const [newStoryPublished, setNewStoryPublished] = useState(false);
  const [publishingStory, setPublishingStory] = useState(false);
  const [storySuccess, setStorySuccess] = useState(false);

  // 4. Alerts Manager State
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [newAlertTitle, setNewAlertTitle] = useState("");
  const [newAlertDescription, setNewAlertDescription] = useState("");
  const [newAlertRiskLevel, setNewAlertRiskLevel] = useState("High");
  const [newAlertStatus, setNewAlertStatus] = useState("under_investigation");
  const [creatingAlert, setCreatingAlert] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);

  // 5. Statistics Manager State
  const [stats, setStats] = useState<Statistics>({ totalVictims: 0, totalLosses: 0, verifiedReports: 0 });
  const [updatingStats, setUpdatingStats] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsSuccess, setStatsSuccess] = useState(false);

  // 6. Comments Moderator State
  const [adminComments, setAdminComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // Check login on mount
  useEffect(() => {
    const token = localStorage.getItem("finguard_admin_token");
    if (token === "finguard_admin_authenticated") {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch data depending on active tab
  useEffect(() => {
    if (!isAuthenticated) return;

    if (activeTab === "stocks") {
      fetchCompaniesStatus();
    } else if (activeTab === "reports") {
      fetchReports();
    } else if (activeTab === "stories") {
      fetchStories();
      fetchReports(); // Required for dropdown selection of verified reports
    } else if (activeTab === "alerts") {
      fetchAlerts();
    } else if (activeTab === "stats") {
      fetchStats();
    } else if (activeTab === "comments") {
      fetchAdminComments();
    }
  }, [isAuthenticated, activeTab]);

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

  // Load companies status from backend (Stock Tab)
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
      if (isAuthenticated && activeTab === "stocks") {
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

  // 2. Fetch Scam Reports
  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await fetch(`${API_BASE}/scam-platform/reports`);
      const data = await res.json();
      if (res.ok) {
        setReports(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  // Update Scam Report Status
  const handleUpdateReportStatus = async (reportId: string, newStatus: "pending" | "verified" | "rejected") => {
    try {
      setUpdatingReportId(reportId);
      const res = await fetch(`${API_BASE}/scam-platform/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
        );
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport((prev) => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingReportId(null);
    }
  };

  // 3. Fetch Published Stories
  const fetchStories = async () => {
    try {
      setLoadingStories(true);
      const res = await fetch(`${API_BASE}/scam-platform/stories`);
      const data = await res.json();
      if (res.ok) {
        setStories(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch stories:", err);
    } finally {
      setLoadingStories(false);
    }
  };

  // Create Story from verified report
  const handlePublishStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryReportId || !newStoryTitle || !newStorySummary) return;

    try {
      setPublishingStory(true);
      const res = await fetch(`${API_BASE}/scam-platform/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: newStoryReportId,
          title: newStoryTitle,
          summary: newStorySummary,
          published: newStoryPublished,
        }),
      });

      if (res.ok) {
        setStorySuccess(true);
        setNewStoryTitle("");
        setNewStorySummary("");
        setNewStoryReportId("");
        fetchStories();
        setTimeout(() => setStorySuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to publish story:", err);
    } finally {
      setPublishingStory(false);
    }
  };

  // Toggle Story published state
  const handleToggleStoryPublish = async (storyId: string, currentPublished: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/scam-platform/stories/${storyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !currentPublished }),
      });
      if (res.ok) {
        setStories((prev) =>
          prev.map((s) => (s.id === storyId ? { ...s, published: !currentPublished } : s))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Fetch Scam Alerts
  const fetchAlerts = async () => {
    try {
      setLoadingAlerts(true);
      const res = await fetch(`${API_BASE}/scam-platform/alerts`);
      const data = await res.json();
      if (res.ok) {
        setAlerts(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Create Alert
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTitle || !newAlertDescription) return;

    try {
      setCreatingAlert(true);
      const res = await fetch(`${API_BASE}/scam-platform/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAlertTitle,
          description: newAlertDescription,
          riskLevel: newAlertRiskLevel,
          status: newAlertStatus,
        }),
      });

      if (res.ok) {
        setAlertSuccess(true);
        setNewAlertTitle("");
        setNewAlertDescription("");
        fetchAlerts();
        setTimeout(() => setAlertSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingAlert(false);
    }
  };

  // Toggle Alert status
  const handleToggleAlertStatus = async (alertId: string, currentStatus: string) => {
    const statusSequence = ["under_investigation", "verified", "closed"];
    const currentIndex = statusSequence.indexOf(currentStatus);
    const nextStatus = statusSequence[(currentIndex + 1) % statusSequence.length];

    try {
      const res = await fetch(`${API_BASE}/scam-platform/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, status: nextStatus } : a))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Fetch statistics
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch(`${API_BASE}/scam-platform/statistics`);
      const data = await res.json();
      if (res.ok) {
        setStats({
          totalVictims: data.data.totalVictims,
          totalLosses: data.data.totalLosses,
          verifiedReports: data.data.verifiedReports,
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Update statistics
  const handleUpdateStats = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingStats(true);
      const res = await fetch(`${API_BASE}/scam-platform/statistics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stats),
      });
      if (res.ok) {
        setStatsSuccess(true);
        setTimeout(() => setStatsSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStats(false);
    }
  };

  // 6. Fetch all comments for moderation
  const fetchAdminComments = async () => {
    try {
      setLoadingComments(true);
      setCommentsError(null);
      const res = await fetch(`${API_BASE}/scam-platform/comments`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminComments(data.data || []);
      } else {
        setCommentsError(data.error || "Failed to fetch discussions.");
      }
    } catch (err) {
      console.error(err);
      setCommentsError("Failed to reach server.");
    } finally {
      setLoadingComments(false);
    }
  };

  // Delete comment from admin portal
  const handleDeleteAdminComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`${API_BASE}/scam-platform/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": localStorage.getItem("finguard_admin_token") || "",
        },
      });

      if (res.ok) {
        setAdminComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert("Failed to delete comment. Unauthorized access.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server.");
    }
  };

  // Quick statistics calculation for scam reports
  const pendingReportsCount = reports.filter((r) => r.status === "pending").length;
  const verifiedReportsCount = reports.filter((r) => r.status === "verified").length;
  const rejectedReportsCount = reports.filter((r) => r.status === "rejected").length;

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
        {/* Glow backdrop overlays */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none z-0"></div>
        <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

        <Card className="w-full max-w-md border-white/10 bg-slate-950/40 backdrop-blur-xl shadow-2xl relative z-10 p-4">
          <CardHeader className="text-center space-y-3">
            <div className="bg-violet-600/15 text-violet-400 p-3.5 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
              <Lock className="h-6 w-6 animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-white tracking-tight">Admin Authentication</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Access institutional controls, verify scam reports, and configure statistics overrides.
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
      {/* Background shadow glow */}
      <div className="absolute top-0 right-[-100px] w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[180px] pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Portal Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold flex items-center tracking-tight text-white gap-2">
              <ShieldAlert className="w-8 h-8 text-violet-500" />
              Unified FinGuard Administration
            </h1>
            <p className="text-xs text-slate-400">
              Manage stock report ingestions, review reported scams, publish stories, and update alerts.
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

        {/* Tab Selection Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3">
          {[
            { id: "reports", label: "Scam Reports", count: pendingReportsCount, icon: <ShieldAlert className="w-4 h-4" /> },
            { id: "stories", label: "Story Publisher", icon: <FileText className="w-4 h-4" /> },
            { id: "alerts", label: "Alerts Manager", icon: <AlertCircle className="w-4 h-4" /> },
            { id: "comments", label: "Comment Manager", count: adminComments.filter(c => c.reported).length, icon: <MessageSquare className="w-4 h-4" /> },
            { id: "stats", label: "Statistics Manager", icon: <Activity className="w-4 h-4" /> },
            { id: "stocks", label: "Stock Ingestion", icon: <Database className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedReport(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge className="bg-red-500 text-white text-[9px] px-1.5 py-0 h-4.5 ml-1">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* --- TAB CONTENT: SCAM REPORTS LIST & VERIFICATION --- */}
        {activeTab === "reports" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Scam reports list */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Reports Status Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Pending Review", value: pendingReportsCount, border: "border-amber-500/20 bg-amber-500/5 text-amber-400" },
                  { label: "Verified Claims", value: verifiedReportsCount, border: "border-green-500/20 bg-green-500/5 text-green-400" },
                  { label: "Rejected Claims", value: rejectedReportsCount, border: "border-red-500/20 bg-red-500/5 text-red-400" }
                ].map((s) => (
                  <Card key={s.label} className={`border ${s.border} shadow-sm backdrop-blur-md`}>
                    <CardHeader className="p-3.5 pb-1">
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3.5 pt-0">
                      <div className="text-2xl font-extrabold text-white">{s.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Reports Table List */}
              <Card className="border-white/10 bg-slate-950/20 backdrop-blur-md">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-200">Scam Submission Inbox</CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">Select any submission to view full details and contact information.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingReports ? (
                    <div className="flex items-center justify-center py-20 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading reports inbox...
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-20 border-t border-white/5 text-xs text-slate-600 italic">
                      No reported scam claims in the database inbox.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-t border-b border-white/5 bg-white/5 font-bold text-slate-400">
                            <th className="p-4">Date</th>
                            <th className="p-4">Scam Type</th>
                            <th className="p-4">Loss Range</th>
                            <th className="p-4">Reporter Name</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.map((report) => {
                            const isSelected = selectedReport?.id === report.id;
                            let statusBadge = "border-amber-500/20 bg-amber-500/10 text-amber-400";
                            if (report.status === "verified") statusBadge = "border-green-500/20 bg-green-500/10 text-green-400";
                            if (report.status === "rejected") statusBadge = "border-red-500/20 bg-red-500/10 text-red-400";

                            return (
                              <tr
                                key={report.id}
                                onClick={() => {
                                  setSelectedReport(report);
                                  setInternalNotes("");
                                }}
                                className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                                  isSelected ? "bg-white/5" : ""
                                }`}
                              >
                                <td className="p-4 font-semibold text-slate-400">
                                  {new Date(report.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 font-bold text-white">{report.scamType}</td>
                                <td className="p-4 font-semibold text-slate-400">{report.lossRange}</td>
                                <td className="p-4 text-slate-300 font-medium">{report.name}</td>
                                <td className="p-4">
                                  <Badge variant="outline" className={`text-[10px] font-bold tracking-wide uppercase py-0.5 ${statusBadge}`}>
                                    {report.status}
                                  </Badge>
                                </td>
                                <td className="p-4 text-right">
                                  <Button size="icon" className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10">
                                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Column: Verification Detail View */}
            <div className="lg:col-span-1">
              {selectedReport ? (
                <Card className="border-white/10 bg-slate-950/30 backdrop-blur-md flex flex-col justify-between sticky top-24 min-h-[500px]">
                  <div>
                    <CardHeader className="pb-3.5 border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-violet-600/10 text-violet-400 border border-violet-600/20 text-[9px] font-bold uppercase tracking-wider">
                          Claim Verification
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          ID: {selectedReport.id.substring(0, 8)}...
                        </span>
                      </div>
                      <CardTitle className="text-base font-extrabold text-white mt-2">
                        {selectedReport.scamType} Scam
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-400">
                        Submitted: {new Date(selectedReport.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-5 pt-5 text-xs text-left">
                      {/* Loss and status */}
                      <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Loss Impact</span>
                          <span className="text-white font-bold">{selectedReport.lossRange}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Current Status</span>
                          <span className="font-bold capitalize text-violet-400">{selectedReport.status}</span>
                        </div>
                      </div>

                      {/* Contact Info (Only for Admin Verification) */}
                      <div className="space-y-2.5 border-b border-white/5 pb-4">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Reporter Contact Details</span>
                        <div className="space-y-1.5 text-slate-300 font-semibold">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>{selectedReport.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{selectedReport.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{selectedReport.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5 border-b border-white/5 pb-4">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Description</span>
                        <p className="text-slate-400 leading-relaxed font-medium bg-white/5 p-3.5 rounded-xl border border-white/5 max-h-36 overflow-y-auto">
                          {selectedReport.description}
                        </p>
                      </div>

                      {/* Evidence */}
                      {selectedReport.evidenceUrl && (
                        <div className="space-y-2 border-b border-white/5 pb-4">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Evidence details</span>
                          <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                            <span className="text-slate-400 font-semibold truncate max-w-[150px]">{selectedReport.evidenceUrl}</span>
                            <a
                              href={selectedReport.evidenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-violet-400 hover:text-white font-bold flex items-center gap-1.5 flex-shrink-0"
                            >
                              Open Link <ArrowUpRight className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Internal Notes */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Internal Notes</span>
                        <textarea
                          rows={3}
                          value={internalNotes}
                          onChange={(e) => setInternalNotes(e.target.value)}
                          placeholder="Analyst verification notes (only stored in session)..."
                          className="w-full resize-none border-white/10 bg-[#0c0d12]/60 focus:border-violet-500 text-[11px] p-2.5 rounded-xl leading-relaxed text-slate-300"
                        />
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="flex flex-col gap-3 border-t border-white/5 pt-4 mt-6">
                    <div className="flex w-full gap-2">
                      <Button
                        onClick={() => handleUpdateReportStatus(selectedReport.id, "verified")}
                        disabled={updatingReportId !== null || selectedReport.status === "verified"}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-9 text-xs rounded-xl cursor-pointer"
                      >
                        {updatingReportId === selectedReport.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Verify Claims"}
                      </Button>
                      <Button
                        onClick={() => handleUpdateReportStatus(selectedReport.id, "rejected")}
                        disabled={updatingReportId !== null || selectedReport.status === "rejected"}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-9 text-xs rounded-xl cursor-pointer"
                      >
                        {updatingReportId === selectedReport.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Reject Claims"}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateReportStatus(selectedReport.id, "pending")}
                      disabled={updatingReportId !== null}
                      className="w-full border-white/10 hover:bg-white/10 text-slate-400 hover:text-white h-8 text-[10px] rounded-lg cursor-pointer"
                    >
                      Mark Contacted / Pending
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card className="border-white/10 bg-slate-950/10 border-2 border-dashed p-10 text-center text-xs text-slate-600 rounded-2xl min-h-[400px] flex items-center justify-center">
                  Select a scam submission from the inbox to verify details, review evidence screenshots, and publish to community stories.
                </Card>
              )}
            </div>

          </div>
        )}

        {/* --- TAB CONTENT: STORY PUBLISHER --- */}
        {activeTab === "stories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side: Publish form */}
            <div className="lg:col-span-1">
              <Card className="border-white/10 bg-slate-950/30 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-200">Publish Verified Story</CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">
                    Compile a verified scam report into a public anonymous warning story.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <form onSubmit={handlePublishStory} className="space-y-4 text-xs text-left">
                    {/* Verified reports dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Verified Report ID</label>
                      <select
                        value={newStoryReportId}
                        onChange={(e) => {
                          const rId = e.target.value;
                          setNewStoryReportId(rId);
                          // Auto populate title and summary from report description if empty
                          const report = reports.find((r) => r.id === rId);
                          if (report) {
                            setNewStoryTitle(`${report.scamType} Scam Victim Story`);
                            setNewStorySummary(report.description);
                          }
                        }}
                        className="w-full bg-[#0c0d12] border border-white/10 text-white rounded-xl h-10 px-3 font-semibold focus:border-violet-500 text-xs"
                        required
                      >
                        <option value="">Select a Verified Report...</option>
                        {reports
                          .filter((r) => r.status === "verified")
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              [{r.scamType}] {r.name} - {r.lossRange} ({r.id.substring(0, 8)})
                            </option>
                          ))}
                      </select>
                      {reports.filter((r) => r.status === "verified").length === 0 && (
                        <p className="text-[10px] text-amber-500 mt-1">No verified reports available. Review submissions first.</p>
                      )}
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Public Story Title</label>
                      <Input
                        value={newStoryTitle}
                        onChange={(e) => setNewStoryTitle(e.target.value)}
                        placeholder="e.g. Lost ₹50,000 in Fake Telegram VIP Trading Group..."
                        className="bg-[#0c0d12] border-white/10 text-white placeholder-slate-600 focus:border-violet-500 rounded-xl"
                        required
                      />
                    </div>

                    {/* Summary */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Public Anonymous Summary</label>
                      <textarea
                        rows={6}
                        value={newStorySummary}
                        onChange={(e) => setNewStorySummary(e.target.value)}
                        placeholder="Provide details of the scam trap. Ensure no real names, emails, or phone numbers are included."
                        className="w-full resize-none border-white/10 bg-[#0c0d12] focus:border-violet-500 text-xs p-3.5 rounded-xl leading-relaxed text-slate-200"
                        required
                      />
                      <p className="text-[9px] text-slate-500">Contact coordinates are automatically scrubbed by the system.</p>
                    </div>

                    {/* Published Toggle */}
                    <div className="flex items-center justify-between border border-white/5 bg-white/5 p-3 rounded-xl">
                      <div>
                        <span className="font-semibold text-white block">Make Live Instantly</span>
                        <span className="text-[10px] text-slate-500 block">Checking this pushes story to the stories feed.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={newStoryPublished}
                        onChange={(e) => setNewStoryPublished(e.target.checked)}
                        className="w-4.5 h-4.5 accent-violet-600"
                      />
                    </div>

                    {storySuccess && (
                      <div className="flex items-center gap-2 border border-green-500/20 bg-green-500/5 text-green-400 p-3 rounded-xl">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Story created successfully!</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={publishingStory || !newStoryReportId}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-10 rounded-xl cursor-pointer"
                    >
                      {publishingStory ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : "Publish Story"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right side: Stories table feed */}
            <div className="lg:col-span-2">
              <Card className="border-white/10 bg-slate-950/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-200">Published Community Stories</CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">
                    Currently published victim stories. Toggle active status to show/hide on the public dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingStories ? (
                    <div className="flex items-center justify-center py-20 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading stories feed...
                    </div>
                  ) : stories.length === 0 ? (
                    <div className="text-center py-20 text-xs text-slate-600 italic">
                      No published stories found. Use the editor to compile and publish story.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-t border-b border-white/5 bg-white/5 font-bold text-slate-400">
                            <th className="p-4">Date</th>
                            <th className="p-4">Title</th>
                            <th className="p-4">Summary Preview</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Action Toggle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stories.map((story) => (
                            <tr key={story.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="p-4 text-slate-400 font-semibold">
                                {new Date(story.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4 font-bold text-white max-w-[180px] truncate">{story.title}</td>
                              <td className="p-4 text-slate-400 max-w-[250px] truncate">{story.summary}</td>
                              <td className="p-4">
                                <Badge
                                  className={story.published ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300"}
                                >
                                  {story.published ? "Live" : "Draft"}
                                </Badge>
                              </td>
                              <td className="p-4 text-right">
                                <Button
                                  size="sm"
                                  onClick={() => handleToggleStoryPublish(story.id, story.published)}
                                  className="bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 hover:text-white rounded-lg h-8 cursor-pointer"
                                >
                                  {story.published ? "Draft Status" : "Publish Live"}
                                </Button>
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
          </div>
        )}

        {/* --- TAB CONTENT: ALERTS MANAGER --- */}
        {activeTab === "alerts" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left side: create warning alert */}
            <div className="lg:col-span-1">
              <Card className="border-white/10 bg-slate-950/30 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-200">Deploy Security Alert</CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">
                    Publish warnings regarding fraudulent Telegram/WhatsApp channels or deepfakes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <form onSubmit={handleCreateAlert} className="space-y-4 text-xs text-left">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Alert Title</label>
                      <Input
                        value={newAlertTitle}
                        onChange={(e) => setNewAlertTitle(e.target.value)}
                        placeholder="e.g. Warning: Fake NSE Stock Tips Channel 'VIP Returns'"
                        className="bg-[#0c0d12] border-white/10 text-white placeholder-slate-600 focus:border-violet-500 rounded-xl"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Warning Details</label>
                      <textarea
                        rows={4}
                        value={newAlertDescription}
                        onChange={(e) => setNewAlertDescription(e.target.value)}
                        placeholder="Input warning, fake SEBI numbers used, group link details, and prevention recommendations..."
                        className="w-full resize-none border-white/10 bg-[#0c0d12] focus:border-violet-500 text-xs p-3.5 rounded-xl leading-relaxed text-slate-200"
                        required
                      />
                    </div>

                    {/* Risk Level and Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">Risk Level</label>
                        <select
                          value={newAlertRiskLevel}
                          onChange={(e) => setNewAlertRiskLevel(e.target.value)}
                          className="w-full bg-[#0c0d12] border border-white/10 text-white rounded-xl h-10 px-3 font-semibold focus:border-violet-500 text-xs"
                        >
                          <option value="High">High Risk</option>
                          <option value="Medium">Medium Risk</option>
                          <option value="Low">Low Risk</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">Status</label>
                        <select
                          value={newAlertStatus}
                          onChange={(e) => setNewAlertStatus(e.target.value)}
                          className="w-full bg-[#0c0d12] border border-white/10 text-white rounded-xl h-10 px-3 font-semibold focus:border-violet-500 text-xs"
                        >
                          <option value="under_investigation">Under Investigation</option>
                          <option value="verified">Verified Scam</option>
                          <option value="closed">Closed Warning</option>
                        </select>
                      </div>
                    </div>

                    {alertSuccess && (
                      <div className="flex items-center gap-2 border border-green-500/20 bg-green-500/5 text-green-400 p-3 rounded-xl">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Security alert deployed successfully!</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={creatingAlert}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-10 rounded-xl cursor-pointer"
                    >
                      {creatingAlert ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : "Deploy Alert Warning"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right side: alerts database table list */}
            <div className="lg:col-span-2">
              <Card className="border-white/10 bg-slate-950/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-200">Active Warning Feeds</CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">
                    Monitor alerts deployed across community scanners. Click action to cycle investigator statuses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingAlerts ? (
                    <div className="flex items-center justify-center py-20 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading alerts monitoring feed...
                    </div>
                  ) : alerts.length === 0 ? (
                    <div className="text-center py-20 text-xs text-slate-600 italic">
                      No deployed alerts on record. Use the form to submit alerts.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-t border-b border-white/5 bg-white/5 font-bold text-slate-400">
                            <th className="p-4">Date</th>
                            <th className="p-4">Alert Title</th>
                            <th className="p-4">Risk Level</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Investigator Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alerts.map((alert) => {
                            let riskBadge = "bg-green-600 text-white";
                            if (alert.riskLevel === "High") riskBadge = "bg-red-600 text-white";
                            if (alert.riskLevel === "Medium") riskBadge = "bg-amber-600 text-white";

                            return (
                              <tr key={alert.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 text-slate-400 font-semibold">
                                  {new Date(alert.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 font-bold text-white max-w-[200px] truncate">{alert.title}</td>
                                <td className="p-4">
                                  <Badge className={`text-[10px] font-bold py-0 h-4.5 ${riskBadge}`}>
                                    {alert.riskLevel}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <Badge variant="outline" className="text-[9px] uppercase tracking-wide px-1.5 h-4.5 border-white/10 font-bold capitalize">
                                    {alert.status.replace(/_/g, ' ')}
                                  </Badge>
                                </td>
                                <td className="p-4 text-right">
                                  <Button
                                    size="sm"
                                    onClick={() => handleToggleAlertStatus(alert.id, alert.status)}
                                    className="bg-white/5 hover:bg-white/10 text-[9px] font-bold text-slate-300 hover:text-white rounded-lg h-8 cursor-pointer"
                                  >
                                    Cycle Status
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
          </div>
        )}

        {/* --- TAB CONTENT: STATISTICS MANAGER OVERRIDES --- */}
        {activeTab === "stats" && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-white/10 bg-slate-950/30 backdrop-blur-md text-left">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-500" />
                  <CardTitle className="text-sm font-bold text-slate-200">Community Statistics Manager</CardTitle>
                </div>
                <CardDescription className="text-[11px] text-slate-500">
                  Manually adjust consolidated stats displayed on public landing page counters. Revalidates dashboard cache immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {loadingStats ? (
                  <div className="flex items-center justify-center py-20 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Querying statistics values...
                  </div>
                ) : (
                  <form onSubmit={handleUpdateStats} className="space-y-6 text-xs">
                    
                    {/* Stat inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">Total Victims</label>
                        <Input
                          type="number"
                          value={stats.totalVictims}
                          onChange={(e) => setStats((prev) => ({ ...prev, totalVictims: parseInt(e.target.value) || 0 }))}
                          className="bg-[#0c0d12] border-white/10 text-white font-bold rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">Total Losses (INR)</label>
                        <Input
                          type="number"
                          value={stats.totalLosses}
                          onChange={(e) => setStats((prev) => ({ ...prev, totalLosses: parseFloat(e.target.value) || 0.0 }))}
                          className="bg-[#0c0d12] border-white/10 text-white font-bold rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">Verified Scam Cases</label>
                        <Input
                          type="number"
                          value={stats.verifiedReports}
                          onChange={(e) => setStats((prev) => ({ ...prev, verifiedReports: parseInt(e.target.value) || 0 }))}
                          className="bg-[#0c0d12] border-white/10 text-white font-bold rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="border border-yellow-500/20 bg-yellow-500/5 p-4 rounded-xl flex items-start gap-3 text-slate-400 leading-normal">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-300 block text-xs">Pre-Computed Cache Revalidation Warning</span>
                        <span className="text-[10px] block mt-0.5">
                          Saving these configurations overrides all calculated SQL entries. Changes update database rows directly to protect production load performances.
                        </span>
                      </div>
                    </div>

                    {statsSuccess && (
                      <div className="flex items-center gap-2 border border-green-500/20 bg-green-500/5 text-green-400 p-3 rounded-xl font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Statistics consolidated successfully! Sync completed.</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={updatingStats}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-11 rounded-xl cursor-pointer"
                    >
                      {updatingStats ? <Loader2 className="w-4.5 w-4.5 animate-spin" /> : "Save Metrics Configuration"}
                    </Button>

                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* --- TAB CONTENT: COMMENTS MODERATION MANAGER --- */}
        {activeTab === "comments" && (
          <div className="space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left text-xs">
              
              {/* Box 1: Reported Comments */}
              <Card className="border-red-500/20 bg-red-950/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-red-400 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" />
                    Reported Comments ({adminComments.filter(c => c.reported).length})
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">
                    Flagged by the community as potential scam tips, promotional link spam, or harassment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingComments ? (
                    <div className="flex items-center justify-center py-20 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading reported inbox...
                    </div>
                  ) : adminComments.filter(c => c.reported).length === 0 ? (
                    <div className="text-center py-20 border-t border-white/5 text-slate-600 italic">
                      Zero reported comments. Inbox is clean!
                    </div>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5">
                      {adminComments.filter(c => c.reported).map((comment) => (
                        <div key={comment.id} className="p-4 flex items-start justify-between gap-4 hover:bg-white/5 transition-colors">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">{comment.author}</span>
                              <span className="text-[9px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-300 font-medium break-words bg-white/5 p-2 rounded-lg border border-white/5">{comment.text}</p>
                            <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold">
                              <span>Upvotes: {comment.upvotes}</span>
                              <span>•</span>
                              <span>Downvotes: {comment.downvotes}</span>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDeleteAdminComment(comment.id)}
                            className="h-8 w-8 rounded-lg flex-shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Box 2: Live Feed */}
              <Card className="border-white/10 bg-slate-950/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-violet-500" />
                    Live Discussion Feed ({adminComments.length})
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">
                    All comments currently visible on the live scams discussions page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingComments ? (
                    <div className="flex items-center justify-center py-20 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading discussion feed...
                    </div>
                  ) : adminComments.length === 0 ? (
                    <div className="text-center py-20 border-t border-white/5 text-slate-600 italic">
                      No comments have been posted yet.
                    </div>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5">
                      {adminComments.map((comment) => (
                        <div key={comment.id} className="p-4 flex items-start justify-between gap-4 hover:bg-white/5 transition-colors">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">{comment.author}</span>
                              <span className="text-[9px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              {comment.reported && (
                                <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] py-0 h-4.5 font-bold uppercase">
                                  Flagged
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-400 break-words">{comment.text}</p>
                            <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold">
                              <span>Upvotes: {comment.upvotes}</span>
                              <span>•</span>
                              <span>Downvotes: {comment.downvotes}</span>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteAdminComment(comment.id)}
                            className="h-8 w-8 rounded-lg hover:bg-red-950/20 hover:text-red-400 text-slate-400 flex-shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

          </div>
        )}

        {/* --- TAB CONTENT: NSE STOCK INGESTION (Original Page functionality) --- */}
        {activeTab === "stocks" && (
          <>
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
                { label: "Ingested Reports", value: companies.filter((c) => c.status === "Completed").length, desc: "Precomputed & Ready", color: "border-emerald-500/20 bg-emerald-950/10 text-emerald-400" },
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
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
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
          </>
        )}

      </div>
    </div>
  );
}
