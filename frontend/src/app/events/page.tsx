"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  Calendar,
  User,
  Clock,
  Lock,
  Unlock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Video,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface WebinarEvent {
  id: string;
  title: string;
  description: string;
  speaker: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  type: "FREE" | "PREMIUM";
  isRegistered: boolean;
  isLive: boolean;
  isAccessible: boolean;
}

export default function EventsPage() {
  const { getToken, isLoaded: isAuthLoaded, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const [webinars, setWebinars] = useState<WebinarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "registered" | "past">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "FREE" | "PREMIUM">("ALL");

  // Keep track of user subscription tier locally
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchWebinars();
    }
  }, [userId]);

  // Dynamic ticking clock checking if webinars are live (polls every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setWebinars((prev) =>
        prev.map((w) => {
          const now = new Date();
          const start = new Date(w.startTime);
          const end = new Date(w.endTime);
          const startWithBuffer = new Date(start.getTime() - 10 * 60 * 1000);
          const isLive = now >= startWithBuffer && now <= end;
          return { ...w, isLive };
        })
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        setIsPremium(body.data?.isPremium || body.data?.plan === "PREMIUM");
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  };

  const fetchWebinars = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const token = await getToken();

      if (!token) {
        setErrorMessage("Please sign in to view scheduled webinar sessions.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/webinars`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to load webinar database");
      const body = await res.json();
      setWebinars(body.webinars || []);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not retrieve webinar events. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (webinarId: string) => {
    setActionLoading(webinarId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Auth session expired. Sign in again.");

      const res = await fetch(`${API_BASE}/api/webinars/${webinarId}/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || body.error || "Failed to register");
      }

      setWebinars(prev =>
        prev.map(w => (w.id === webinarId ? { ...w, isRegistered: true } : w))
      );
      setSuccessMessage("Successfully registered! We will notify you when it starts.");
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnregister = async (webinarId: string) => {
    setActionLoading(webinarId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Auth session expired. Sign in again.");

      const res = await fetch(`${API_BASE}/api/webinars/${webinarId}/unregister`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || body.error || "Failed to cancel registration");
      }

      setWebinars(prev =>
        prev.map(w => (w.id === webinarId ? { ...w, isRegistered: false } : w))
      );
      setSuccessMessage("Registration canceled successfully.");
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleJoin = async (webinarId: string) => {
    setActionLoading(webinarId);
    setErrorMessage(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Auth token invalid.");

      const res = await fetch(`${API_BASE}/api/webinars/${webinarId}/join`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || body.error || "Cannot join live link yet.");
      }

      const body = await res.json();
      if (body.zoomLink) {
        window.open(body.zoomLink, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("No Zoom meeting link provided by event host.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper date formatting
  const formatEventTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  // Filter webinars list based on tabs, search and type filters
  const filteredWebinars = webinars.filter((w) => {
    const now = new Date();
    const startTime = new Date(w.startTime);
    const endTime = new Date(w.endTime);

    // Tab logic
    if (activeTab === "registered" && !w.isRegistered) return false;
    if (activeTab === "past" && endTime >= now) return false;
    if (activeTab === "upcoming" && endTime < now) return false;

    // Search query
    const matchesSearch =
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.speaker.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType = typeFilter === "ALL" || w.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#8B949E] px-4 md:px-8 py-12 relative overflow-hidden select-none">
      {/* Background glow styling */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[180px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[10%] w-[350px] h-[350px] bg-[#6366F1]/5 rounded-full blur-[140px] pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3.5">
          <div className="bg-[#6366F1]/10 border border-[#6366F1]/20 p-3 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center text-[#6366F1]">
            <Video className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase">Live Webinars & Classes</h1>
          <p className="text-sm text-[#8B949E] leading-relaxed">
            Enhance your trading structure and indicators knowledge directly from industry specialists. Access exclusive premium webinars.
          </p>
        </div>

        {/* Global Notices */}
        {errorMessage && (
          <div className="flex items-center gap-3 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs p-4 rounded-xl max-w-2xl mx-auto">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs p-4 rounded-xl max-w-2xl mx-auto">
            <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Control row (Filters & Search) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#161B22] p-4 rounded-xl border border-[#21262D]">
          
          {/* Tab Filters */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {[
              { id: "upcoming", label: "Upcoming Events" },
              { id: "registered", label: "Registered (" + webinars.filter(w => w.isRegistered).length + ")" },
              { id: "past", label: "Past Archive" }
            ].map(tab => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                className={`text-xs font-semibold h-9 rounded-lg ${
                  activeTab === tab.id
                    ? "bg-[#6366F1] text-white hover:bg-[#6366F1]/90"
                    : "border-[#21262D] bg-[#0D1117] text-[#8B949E] hover:text-white"
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8B949E]" />
              <input
                type="text"
                placeholder="Search webinars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#21262D] bg-[#0D1117] text-white placeholder-[#8B949E]/60 text-xs focus:outline-none focus:border-[#6366F1]"
              />
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 mr-1 text-[#8B949E] flex-shrink-0" />
              {(["ALL", "FREE", "PREMIUM"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`text-[10px] font-bold px-2.5 py-1 border transition-colors ${
                    typeFilter === f
                      ? "border-[#6366F1] text-white bg-[#6366F1]/10"
                      : "border-[#21262D] text-[#8B949E] hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Webinars Grid List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#8B949E]">
            <Loader2 className="w-8 h-8 animate-spin text-[#6366F1] mb-3" />
            <p className="text-xs uppercase tracking-widest font-bold">Synchronizing events calendar...</p>
          </div>
        ) : filteredWebinars.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#21262D] bg-[#161B22]/30 rounded-xl max-w-4xl mx-auto space-y-3">
            <Calendar className="w-10 h-10 mx-auto text-[#21262D]" />
            <h3 className="font-bold text-white text-base">No Webinars Found</h3>
            <p className="text-xs text-[#8B949E]">
              {activeTab === "registered"
                ? "You have not registered for any upcoming events."
                : "No webinar sessions match the selected query criteria."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWebinars.map((webinar) => {
              const isEventPremium = webinar.type === "PREMIUM";
              const userHasAccess = !isEventPremium || isPremium;
              const isWorking = actionLoading === webinar.id;

              return (
                <Card
                  key={webinar.id}
                  className={`border transition-all duration-350 hover:shadow-xl bg-[#161B22] flex flex-col justify-between overflow-hidden group h-full ${
                    webinar.isLive 
                      ? "border-[#6366F1] shadow-[0_0_15px_-3px_rgba(99,102,241,0.25)]" 
                      : "border-[#21262D] hover:border-[#30363D]"
                  }`}
                >
                  <CardHeader className="pb-3 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      {isEventPremium ? (
                        <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Premium Event
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1">
                          <Unlock className="w-2.5 h-2.5" /> Free Event
                        </Badge>
                      )}

                      {webinar.isLive && (
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold text-white group-hover:text-[#6366F1] transition-colors leading-snug">
                      {webinar.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-[#8B949E] line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
                      {webinar.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3.5 pb-5 text-left border-t border-[#21262D]/40 pt-4 flex-1">
                    {/* Speaker */}
                    <div className="flex items-center text-xs text-white">
                      <div className="w-7 h-7 bg-[#21262D] rounded-full flex items-center justify-center mr-2.5 border border-[#30363D]">
                        <User className="w-3.5 h-3.5 text-[#6366F1]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#8B949E] leading-none uppercase tracking-wide">Expert Speaker</p>
                        <p className="font-bold mt-0.5">{webinar.speaker}</p>
                      </div>
                    </div>

                    {/* Date details */}
                    <div className="flex items-center text-xs text-white">
                      <div className="w-7 h-7 bg-[#21262D] rounded-full flex items-center justify-center mr-2.5 border border-[#30363D]">
                        <Calendar className="w-3.5 h-3.5 text-[#6366F1]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#8B949E] leading-none uppercase tracking-wide">Schedule</p>
                        <p className="font-semibold mt-0.5">{formatEventTime(webinar.startTime)}</p>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="bg-[#0D1117]/50 border-t border-[#21262D] p-4.5 flex flex-col gap-2">
                    {/* Live active Join logic */}
                    {webinar.isRegistered && webinar.isLive && userHasAccess ? (
                      <Button
                        onClick={() => handleJoin(webinar.id)}
                        disabled={isWorking}
                        className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-bold h-9 text-xs rounded-lg animate-pulse hover:animate-none flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#6366F1]/20 border border-[#6366F1]/30"
                      >
                        {isWorking ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            Join Live Now <ExternalLink className="w-3.5 h-3.5" />
                          </>
                        )}
                      </Button>
                    ) : webinar.isRegistered && userHasAccess ? (
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          onClick={() => handleUnregister(webinar.id)}
                          disabled={isWorking}
                          variant="outline"
                          className="flex-1 border-[#21262D] bg-[#0D1117] text-rose-400 hover:bg-rose-500/10 text-xs h-9 font-semibold cursor-pointer rounded-lg"
                        >
                          {isWorking ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Leave Event"}
                        </Button>
                        <div className="flex items-center justify-center gap-1 px-3 h-9 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs font-bold w-32 flex-shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                        </div>
                      </div>
                    ) : userHasAccess ? (
                      <Button
                        onClick={() => handleRegister(webinar.id)}
                        disabled={isWorking || activeTab === "past"}
                        className="w-full bg-[#21262D] text-white hover:bg-[#30363D] border border-[#30363D] font-bold h-9 text-xs rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isWorking ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : activeTab === "past" ? (
                          "Archived Event"
                        ) : (
                          <>
                            Register for Free <ArrowRight className="w-3.5 h-3.5 text-[#6366F1]" />
                          </>
                        )}
                      </Button>
                    ) : (
                      // Locked Premium overlay
                      <Link href="/plans" className="w-full">
                        <Button className="w-full bg-[#2E1065] text-purple-300 hover:bg-[#3B0764] border border-purple-500/30 font-bold h-9 text-xs rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-inner">
                          <Lock className="w-3.5 h-3.5" /> Upgrade to Register
                        </Button>
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
