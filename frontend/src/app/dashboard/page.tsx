"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, ShieldAlert, Calendar, TrendingUp, CreditCard, ShieldCheck, Sparkles, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useUserDb } from "@/context/UserContext";
import Link from "next/link";

export default function DashboardPage() {
  const { dbUser, loadingDbUser } = useUserDb();

  const calculateDaysRemaining = (expiryDate: string | null) => {
    if (!expiryDate) return 0;
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const daysLeft = dbUser ? calculateDaysRemaining(dbUser.planExpiryDate) : 0;

  return (
    <div className="fg-shell min-h-[calc(100vh-4rem)] px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Top Header Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="fg-panel rounded-lg p-6 md:p-8 md:col-span-2 flex flex-col justify-between border border-border bg-card shadow-sm">
            <div>
              <div aria-hidden className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Bookmark className="h-5 w-5" />
              </div>
              <h1 className="fg-title text-3xl md:text-4xl text-foreground">My Dashboard</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Manage your saved research, track scam reports, and view upcoming events.
              </p>
            </div>
          </div>

          {/* Dynamic Plan Card */}
          <div className="fg-panel rounded-lg p-6 border border-border bg-card flex flex-col justify-between relative overflow-hidden shadow-sm">
            {loadingDbUser ? (
              <div className="flex h-full items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !dbUser ? (
              <div className="space-y-4">
                <h3 className="font-bold text-foreground text-lg">Access Denied</h3>
                <p className="text-xs text-muted-foreground">Please sign in to view your account subscription plan details.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Account Tier</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      dbUser.plan === "PREMIUM"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                        : dbUser.plan === "STANDARD"
                        ? "bg-primary/10 border border-primary/20 text-primary"
                        : "bg-muted border border-border text-muted-foreground"
                    }`}>
                      {dbUser.plan} Plan
                    </span>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground">
                      <CreditCard className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">Current Plan Status</p>
                      <h4 className="text-sm font-black text-foreground">
                        {dbUser.plan === "FREE" ? "Free Trial Active" : "Subscribed"}
                      </h4>
                    </div>
                  </div>

                  {dbUser.plan !== "FREE" && (
                    <div className="mt-4 space-y-2 text-xs font-semibold text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Activated:</span>
                        <span className="text-foreground">
                          {dbUser.planStartDate ? new Date(dbUser.planStartDate).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expires:</span>
                        <span className="text-foreground">
                          {dbUser.planExpiryDate ? new Date(dbUser.planExpiryDate).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {dbUser.plan === "FREE" ? (
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-muted-foreground leading-normal">
                        Upgrade to Standard or Premium to run more AI stock analysis reports.
                      </p>
                      <Link href="/plans" className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1 cursor-pointer">
                        Upgrade Plan <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`px-3 py-2 rounded-xl border text-[11px] font-bold text-center flex items-center justify-center gap-1.5 ${
                        daysLeft <= 5
                          ? "bg-red-500/10 border-red-500/20 text-red-650"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                      }`}>
                        {daysLeft <= 5 ? (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-red-650" />
                            <span>{daysLeft} Days Remaining (Renew Soon)</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{daysLeft} Days Remaining</span>
                          </>
                        )}
                      </div>
                      <Link href="/plans" className="w-full py-2 bg-card hover:bg-muted text-foreground text-[11px] font-black uppercase tracking-wider rounded-xl transition-all border border-border flex items-center justify-center gap-1 cursor-pointer">
                        Change Plan
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="analyses" className="w-full">
          <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4">
            <TabsTrigger value="analyses" className="py-2.5"><TrendingUp className="w-4 h-4 mr-2" /> Analyses</TabsTrigger>
            <TabsTrigger value="scans" className="py-2.5"><ShieldAlert className="w-4 h-4 mr-2" /> Scans</TabsTrigger>
            <TabsTrigger value="articles" className="py-2.5"><Bookmark className="w-4 h-4 mr-2" /> Articles</TabsTrigger>
            <TabsTrigger value="events" className="py-2.5"><Calendar className="w-4 h-4 mr-2" /> Events</TabsTrigger>
          </TabsList>
        
          <TabsContent value="analyses">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="relative overflow-hidden">
                <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-primary" />
                <CardHeader>
                  <CardTitle className="text-lg">RELIANCE</CardTitle>
                  <CardDescription>Analyzed on Oct 12, 2026</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Strong retail growth, O2C margin pressure.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scans">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-lg text-destructive">Telegram VIP Tip</CardTitle>
                  <CardDescription>Scanned on Oct 10, 2026</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Result: 98% Scam Probability (Pump and Dump)</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="articles">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Understanding P/E Ratio</CardTitle>
                  <CardDescription>Saved 2 days ago</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Identifying Market Scams</CardTitle>
                  <CardDescription>Oct 20, 2026 - 6:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground font-medium text-success">Registered</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
