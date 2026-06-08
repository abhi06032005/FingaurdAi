"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  FileText, 
  BellRing, 
  Activity, 
  CheckCircle2, 
  ChevronRight,
  Clock,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Statistics {
  totalVictims: number;
  totalLosses: number;
  verifiedReports: number;
  updatedAt: string;
}

interface Story {
  id: string;
  reportId: string;
  title: string;
  summary: string;
  published: boolean;
  createdAt: string;
  scamType?: string;
  lossRange?: string;
}

interface Alert {
  id: string;
  title: string;
  description: string;
  riskLevel: string;
  status: string;
  createdAt: string;
}

export default function ScamTrackerPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all precomputed/cached stats, alerts, and stories from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, storiesRes, alertsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/scam-platform/statistics`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/scam-platform/stories`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/scam-platform/alerts`)
        ]);

        if (statsRes.ok && storiesRes.ok && alertsRes.ok) {
          const statsData = await statsRes.json();
          const storiesData = await storiesRes.json();
          const alertsData = await alertsRes.json();

          setStats(statsData.data);
          setStories(storiesData.data || []);
          setAlerts(alertsData.data || []);
        } else {
          setError("Failed to retrieve dashboard datasets.");
        }
      } catch (err: any) {
        console.error(err);
        setError("Error connecting to the tracker servers.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format money in INR format (₹ Lakhs / Crores)
  const formatLoss = (lossStr: number) => {
    if (lossStr >= 10000000) {
      return `₹${(lossStr / 10000000).toFixed(2)} Cr`;
    }
    if (lossStr >= 100000) {
      return `₹${(lossStr / 100000).toFixed(2)} Lakhs`;
    }
    return `₹${lossStr.toLocaleString("en-IN")}`;
  };

  return (
    <div className="bg-[#050506] min-h-screen text-foreground pb-20">
      
      {/* Background radial overlays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[550px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-150px] left-[25%] w-[40%] h-[350px] bg-red-600/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-16 relative z-10 space-y-8">
        
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/5">
          <div className="space-y-1">
            <Link href="/scams" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Scam Hub
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <ShieldAlert className="h-8 w-8 text-red-500" />
              Live Scam Tracker Dashboard
            </h1>
            <p className="text-sm text-gray-400">
              Community impact counters, verified victim stories, and active high-risk warnings.
            </p>
          </div>

          <Link href="/scams/report" passHref>
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full px-6 flex items-center gap-1 cursor-pointer">
              Report a Scam <ChevronRight className="h-4.5 w-4.5" />
            </Button>
          </Link>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-32 bg-muted rounded-xl md:col-span-3"></div>
            <div className="h-96 bg-muted rounded-xl md:col-span-2"></div>
            <div className="h-96 bg-muted rounded-xl"></div>
          </div>
        ) : error ? (
          <Card className="border-destructive/30 bg-destructive/5 text-destructive p-6 rounded-xl flex items-center gap-4">
            <ShieldAlert className="h-10 w-10 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Failed to load live tracker</h3>
              <p className="text-muted-foreground mt-1">{error}</p>
            </div>
          </Card>
        ) : (
          <>
            {/* 1. Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Total Victims */}
              <Card className="border-border/60 bg-card/45 backdrop-blur-sm shadow-sm hover:border-border transition-colors">
                <CardContent className="p-6 space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Total Verified Victims</span>
                  <div className="text-3xl font-extrabold text-white tracking-tight">
                    {stats?.totalVictims}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1.5 border-t border-white/5 mt-3">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span>Active claims validated by analysts</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Total Losses */}
              <Card className="border-border/60 bg-card/45 backdrop-blur-sm shadow-sm hover:border-border transition-colors">
                <CardContent className="p-6 space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Total Reported Losses</span>
                  <div className="text-3xl font-extrabold text-red-500 tracking-tight">
                    {stats ? formatLoss(stats.totalLosses) : "₹0.00"}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1.5 border-t border-white/5 mt-3">
                    <TrendingDown className="h-4 w-4 text-red-500 animate-pulse" />
                    <span>Consolidated financial fraud footprint</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Verified Scam Cases */}
              <Card className="border-border/60 bg-card/45 backdrop-blur-sm shadow-sm hover:border-border transition-colors">
                <CardContent className="p-6 space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Verified Scam Cases</span>
                  <div className="text-3xl font-extrabold text-white tracking-tight">
                    {stats?.verifiedReports}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1.5 border-t border-white/5 mt-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Last updated: {stats ? new Date(stats.updatedAt).toLocaleDateString() : "Never"}</span>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* 2. Main Dashboard Split (Left: Alert Feed & Stories, Right: Categories list) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column (Span 2) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Latest Scam Alerts Feed */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <BellRing className="h-5 w-5 text-red-500 animate-swing" />
                      Latest Scam Alerts
                    </h2>
                    <Link href="/scams/alerts" className="text-xs text-violet-400 font-bold hover:text-white flex items-center gap-1">
                      View full feed <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {alerts.length === 0 ? (
                      <Card className="p-6 text-center text-xs text-muted-foreground">
                        No active alerts. Stay vigilant.
                      </Card>
                    ) : (
                      alerts.slice(0, 3).map((alert) => (
                        <Card key={alert.id} className="border-border/60 bg-card/30 backdrop-blur-sm p-5 hover:border-border transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3.5 mb-3">
                            <div className="flex items-center gap-2.5">
                              <h3 className="font-extrabold text-sm sm:text-base text-white">{alert.title}</h3>
                              <Badge className={`text-[9px] font-bold py-0 h-4 ${
                                alert.riskLevel === "High" 
                                  ? "bg-red-600 text-white" 
                                  : alert.riskLevel === "Medium" 
                                  ? "bg-amber-600 text-white" 
                                  : "bg-green-600 text-white"
                              }`}>
                                {alert.riskLevel} Risk
                              </Badge>
                            </div>
                            <span className="text-[10px] text-gray-500 font-semibold">
                              {new Date(alert.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{alert.description}</p>
                          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-500 font-bold">
                            <Badge variant="outline" className="text-[8px] uppercase tracking-wide px-1.5 h-4.5 border-white/10 font-bold">
                              {alert.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Recently Verified Victim Stories */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-400" />
                      Recently Verified Stories
                    </h2>
                    <Link href="/scams/stories" className="text-xs text-violet-400 font-bold hover:text-white flex items-center gap-1">
                      View all stories <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {stories.length === 0 ? (
                      <Card className="col-span-2 p-6 text-center text-xs text-muted-foreground">
                        No stories published yet. Verification process pending.
                      </Card>
                    ) : (
                      stories.slice(0, 2).map((story) => (
                        <Card key={story.id} className="border-border/60 bg-card/30 backdrop-blur-sm p-5 flex flex-col justify-between hover:border-border transition-colors h-[210px]">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <Badge className="bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 text-[9px] font-bold py-0 h-4">
                                🛡️ Verified
                              </Badge>
                              {story.scamType && (
                                <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold py-0 h-4">
                                  {story.scamType}
                                </Badge>
                              )}
                              {story.lossRange && (
                                <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold py-0 h-4">
                                  {story.lossRange}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-extrabold text-sm sm:text-base text-white line-clamp-1">{story.title}</h3>
                            <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">{story.summary}</p>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 pt-3 mt-3 font-semibold">
                            <span>Anonymous</span>
                            <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column (Span 1) */}
              <div className="space-y-8">
                
                {/* Scam Categories Quick Link List */}
                <Card className="border-border/60 bg-card/30 backdrop-blur-sm shadow-sm p-6">
                  <h3 className="font-bold text-base text-white border-b border-white/5 pb-3.5 mb-4 flex items-center gap-2">
                    <Briefcase className="h-4.5 w-4.5 text-primary" />
                    Scam Classifications
                  </h3>
                  <ul className="space-y-3.5 text-xs font-semibold">
                    {[
                      { name: "Telegram Group Scams", slug: "telegram-scam", color: "bg-blue-500" },
                      { name: "Pump & Dump Schemes", slug: "pump-dump", color: "bg-red-500" },
                      { name: "WhatsApp Selection Scams", slug: "whatsapp-scam", color: "bg-green-500" },
                      { name: "Fake Advisory Scams", slug: "fake-advisor", color: "bg-amber-500" },
                      { name: "Fake Trading Apps", slug: "fake-app", color: "bg-violet-500" },
                      { name: "Deepfake Influencers", slug: "deepfake-scam", color: "bg-fuchsia-500" },
                    ].map((cat) => (
                      <li key={cat.slug} className="group">
                        <Link href={`/scams/${cat.slug}`} className="flex items-center justify-between text-gray-400 group-hover:text-white transition-colors py-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
                            <span>{cat.name}</span>
                          </div>
                          <ChevronRight className="h-4.5 w-4.5 text-gray-600 group-hover:text-white transition-colors" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Fast educational prevention guide callout */}
                <div className="border border-white/10 rounded-2xl bg-gradient-to-br from-violet-950/20 to-indigo-950/20 p-6 space-y-4">
                  <h4 className="font-extrabold text-base text-white">Prevent Scams Locally</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    Our educational portal runs completely off-database, loading statically compiled files instantaneously. Access quizzes and guidelines to protect your funds.
                  </p>
                  <Link href="/scams" passHref>
                    <Button size="lg" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-sm">
                      Access Educational Guides
                    </Button>
                  </Link>
                </div>

              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}
