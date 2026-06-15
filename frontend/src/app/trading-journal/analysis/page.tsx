"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar, 
  Sparkles, 
  DollarSign, 
  Percent, 
  Award,
  AlertCircle,
  FileText,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUserDb } from "@/context/UserContext";
import { JournalRestriction } from "@/components/trading-journal/journal-restriction";

// Define trade type matching schema.prisma
interface Trade {
  id: string;
  userId: string;
  symbol: string;
  instrumentType: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryDate: string;
  exitDate: string;
  plannedStopLoss?: number | null;
  plannedTarget?: number | null;
  strategy: string;
  confidenceScore: number;
  emotion?: string | null;
  exitReason?: string | null;
  mistakes: string[];
  tradeIdea?: string | null;
  lessonLearned?: string | null;
  optionType?: string | null;
  strikePrice?: number | null;
  expiryDate?: string | null;
  premiumPaid?: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function AnalysisPage() {
  const { userId, isLoaded, getToken } = useAuth();
  const { dbUser, loadingDbUser } = useUserDb();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Heatmap navigation state
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-indexed

  // Detailed view state for daily clicked trades
  const [selectedDayTrades, setSelectedDayTrades] = useState<{
    dateStr: string;
    trades: Trade[];
  } | null>(null);

  // Fetch trades from backend API
  useEffect(() => {
    if (!isLoaded || !userId) return;

    const fetchTrades = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trades`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const result = await response.json();
        
        if (response.ok) {
          setTrades(result.data || []);
        } else {
          setError(result.error || "Failed to load trade data");
        }
      } catch (err: any) {
        console.error("Failed to fetch trades:", err);
        setError("Could not connect to the backend server.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [userId, isLoaded]);

  // Helper: calculate individual trade P&L
  const getPnl = (trade: Trade): number => {
    const entry = Number(trade.entryPrice) || 0;
    const exit = Number(trade.exitPrice) || 0;
    const qty = Number(trade.quantity) || 0;
    return trade.direction === "Long" ? (exit - entry) * qty : (entry - exit) * qty;
  };

  // Helper: calculate return percentage
  const getReturnPercent = (trade: Trade): number => {
    const entry = Number(trade.entryPrice) || 0;
    const exit = Number(trade.exitPrice) || 0;
    if (entry <= 0) return 0;
    return trade.direction === "Long" ? ((exit - entry) / entry) * 100 : ((entry - exit) / entry) * 100;
  };

  // Calculations for dashboard metrics
  const metrics = useMemo(() => {
    if (trades.length === 0) return null;

    let totalPnl = 0;
    let winCount = 0;
    let lossCount = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    trades.forEach((trade) => {
      const pnl = getPnl(trade);
      totalPnl += pnl;
      if (pnl > 0) {
        winCount++;
        grossProfit += pnl;
      } else if (pnl < 0) {
        lossCount++;
        grossLoss += Math.abs(pnl);
      }
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const avgProfit = winCount > 0 ? grossProfit / winCount : 0;
    const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;

    return {
      totalPnl,
      totalTrades,
      winCount,
      lossCount,
      winRate,
      avgProfit,
      avgLoss,
      profitFactor,
    };
  }, [trades]);

  // Strategy Grouping for custom bar chart
  const strategyData = useMemo(() => {
    const groups: Record<string, { pnl: number; count: number; wins: number }> = {};
    trades.forEach((trade) => {
      const pnl = getPnl(trade);
      if (!groups[trade.strategy]) {
        groups[trade.strategy] = { pnl: 0, count: 0, wins: 0 };
      }
      groups[trade.strategy].pnl += pnl;
      groups[trade.strategy].count += 1;
      if (pnl > 0) {
        groups[trade.strategy].wins += 1;
      }
    });

    return Object.entries(groups).map(([name, data]) => ({
      name,
      pnl: data.pnl,
      count: data.count,
      winRate: (data.wins / data.count) * 100,
    })).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  // Aggregate daily trade P&L for selected month and overall max abs daily P&L
  const heatmapData = useMemo(() => {
    const dailyMap: Record<string, { pnl: number; trades: Trade[] }> = {};
    
    // Sort all trades chronological first to make cumulative chart correct
    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    // Generate daily mapping
    sortedTrades.forEach((trade) => {
      const dateStr = new Date(trade.entryDate).toLocaleDateString("en-CA"); // YYYY-MM-DD
      const pnl = getPnl(trade);
      
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { pnl: 0, trades: [] };
      }
      dailyMap[dateStr].pnl += pnl;
      dailyMap[dateStr].trades.push(trade);
    });

    // Find max absolute daily P&L for visual color scale
    let maxAbsDailyPnl = 0;
    Object.values(dailyMap).forEach((day) => {
      const absVal = Math.abs(day.pnl);
      if (absVal > maxAbsDailyPnl) {
        maxAbsDailyPnl = absVal;
      }
    });

    return {
      dailyMap,
      maxAbsDailyPnl,
      sortedTrades
    };
  }, [trades]);

  // Calendar generation helpers
  const calendarCells = useMemo(() => {
    const year = currentYear;
    const month = currentMonth;

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    
    // Fill previous month trailing days as empty placeholder cells
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, dateStr: null });
    }

    // Fill current month cells
    for (let day = 1; day <= daysInMonth; day++) {
      const formattedMonth = String(month + 1).padStart(2, "0");
      const formattedDay = String(day).padStart(2, "0");
      const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
      cells.push({ day, dateStr });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Cumulative P&L points computation for custom Line Chart SVG
  const cumulativeChartPoints = useMemo(() => {
    if (heatmapData.sortedTrades.length === 0) return "";
    
    let cumPnl = 0;
    const dataPoints = heatmapData.sortedTrades.map((trade) => {
      cumPnl += getPnl(trade);
      return {
        date: new Date(trade.entryDate),
        pnl: cumPnl
      };
    });

    if (dataPoints.length === 1) {
      return {
        path: `M 10 100 L 490 100`,
        gradientPath: `M 10 100 L 490 100 L 490 180 L 10 180 Z`,
        points: [{ x: 10, y: 100 }, { x: 490, y: 100 }],
        minVal: 0,
        maxVal: 0,
      };
    }

    const minPnl = Math.min(...dataPoints.map(d => d.pnl), 0);
    const maxPnl = Math.max(...dataPoints.map(d => d.pnl), 100);
    const range = maxPnl - minPnl;
    const padding = range * 0.1 || 20;

    const yMin = minPnl - padding;
    const yMax = maxPnl + padding;
    const yRange = yMax - yMin;

    const width = 500;
    const height = 180;

    const coords = dataPoints.map((point, index) => {
      const x = 10 + (index / (dataPoints.length - 1)) * (width - 20);
      const y = height - 10 - ((point.pnl - yMin) / yRange) * (height - 20);
      return { x, y, pnl: point.pnl, date: point.date };
    });

    const path = `M ${coords.map(c => `${c.x} ${c.y}`).join(" L ")}`;
    
    // Path closed at bottom for gradient fill
    const yZero = height - 10 - ((0 - yMin) / yRange) * (height - 20);
    const cappedYZero = Math.max(10, Math.min(height - 10, yZero));
    const gradientPath = `M ${coords[0].x} ${cappedYZero} L ${coords.map(c => `${c.x} ${c.y}`).join(" L ")} L ${coords[coords.length - 1].x} ${height - 5} L ${coords[0].x} ${height - 5} Z`;

    return {
      path,
      gradientPath,
      points: coords,
      minVal: minPnl,
      maxVal: maxPnl,
    };
  }, [heatmapData]);

  // Auth Protection render
  if (isLoaded && !userId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/60 bg-card/60 backdrop-blur-md shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="bg-destructive/10 text-destructive p-3 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Authentication Required</CardTitle>
            <CardDescription>
              Please log in to view and analyze your trading journal history.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <Link href="/login" passHref>
              <Button size="lg" className="w-full font-semibold flex items-center justify-center gap-2">
                <UserCheck className="h-5 w-5" />
                Sign In to Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingDbUser) {
    return (
      <div className="fg-shell min-h-screen flex items-center justify-center text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dbUser || (dbUser.plan !== "STANDARD" && dbUser.plan !== "PREMIUM")) {
    return <JournalRestriction />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1">
            <Link href="/trading-journal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Journal
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <CalendarCheck className="h-8 w-8 text-primary" />
              Trade Performance Analysis
            </h1>
            <p className="text-muted-foreground">
              Sleek Zerodha-style heat map, trade statistics, and performance breakdown.
            </p>
          </div>
          
          {/* AI Banner Action Link */}
          <Link href="/trading-journal/analysis/ai" passHref>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-md hover:shadow-lg transition-all border-none cursor-pointer">
              <Sparkles className="h-5 w-5 animate-pulse" />
              Analyze with AI
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
            <AlertCircle className="h-10 w-10 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Failed to load analytics</h3>
              <p className="text-muted-foreground mt-1">{error}</p>
            </div>
          </Card>
        ) : trades.length === 0 ? (
          <Card className="border-dashed border-2 border-muted text-center py-20 bg-card/20 backdrop-blur-sm rounded-2xl max-w-2xl mx-auto space-y-6">
            <div className="bg-primary/10 text-primary p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <Activity className="h-8 w-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl font-bold">No trades recorded yet</h2>
              <p className="text-muted-foreground text-sm">
                Log your stock, futures, or options trades in the journal page first. We will automatically generate your performance metrics.
              </p>
            </div>
            <Link href="/trading-journal" passHref>
              <Button size="lg" className="font-semibold shadow-sm">
                Log Your First Trade
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* 1. Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Card 1: Net P&L */}
              <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden relative group hover:border-border transition-colors">
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider">Net P&L</span>
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div className={`text-xl font-bold tracking-tight ${metrics!.totalPnl > 0 ? "text-green-500" : metrics!.totalPnl < 0 ? "text-red-500" : ""}`}>
                    ₹{metrics!.totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium mt-1">
                    {metrics!.totalPnl > 0 ? (
                      <span className="text-green-500 flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> Profit</span>
                    ) : metrics!.totalPnl < 0 ? (
                      <span className="text-red-500 flex items-center gap-0.5"><TrendingDown className="h-3 w-3" /> Loss</span>
                    ) : "Even"}
                    overall performance
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Win Rate */}
              <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm hover:border-border transition-colors">
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider">Win Rate</span>
                    <Percent className="h-4 w-4" />
                  </div>
                  <div className="text-xl font-extrabold tracking-tight">
                    {metrics!.winRate.toFixed(1)}%
                  </div>
                  <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics!.winRate}%` }}></div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Total Trades */}
              <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm hover:border-border transition-colors">
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Trades</span>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="text-xl font-bold tracking-tight">
                    {metrics!.totalTrades}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium mt-1">
                    <span className="text-green-500 font-bold">{metrics!.winCount} W</span> / <span className="text-red-500 font-bold">{metrics!.lossCount} L</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Avg Profit */}
              <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm hover:border-border transition-colors">
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider">Avg Win</span>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-xl font-bold tracking-tight text-green-500">
                    ₹{metrics!.avgProfit.toFixed(1)}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium block mt-1">Per winning trade</span>
                </CardContent>
              </Card>

              {/* Card 5: Avg Loss */}
              <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm hover:border-border transition-colors">
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider">Avg Loss</span>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="text-xl font-bold tracking-tight text-red-500">
                    ₹{metrics!.avgLoss.toFixed(1)}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium block mt-1">Per losing trade</span>
                </CardContent>
              </Card>

              {/* Card 6: Profit Factor */}
              <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm hover:border-border transition-colors">
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider">Profit Factor</span>
                    <Award className="h-4 w-4" />
                  </div>
                  <div className={`text-xl font-bold tracking-tight ${metrics!.profitFactor >= 1.5 ? "text-green-500" : metrics!.profitFactor >= 1.0 ? "text-yellow-500" : "text-red-500"}`}>
                    {metrics!.profitFactor.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium block mt-1">Gross Win / Gross Loss</span>
                </CardContent>
              </Card>
            </div>

            {/* 2. Heat Map and Win/Loss Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Zerodha style heat map */}
              <Card className="lg:col-span-2 border-border/60 bg-card/30 backdrop-blur-sm shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Profit & Loss Calendar
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Daily consolidated trade returns. Click on a day to view its logged trades.
                    </CardDescription>
                  </div>

                  {/* Calendar Navigation Controller */}
                  <div className="flex items-center gap-2 border rounded-lg p-1 bg-background">
                    <Button variant="ghost" size="icon-xs" onClick={handlePrevMonth} className="h-7 w-7 cursor-pointer hover:bg-muted">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-bold px-2 whitespace-nowrap min-w-[110px] text-center">
                      {monthNames[currentMonth]} {currentYear}
                    </span>
                    <Button variant="ghost" size="icon-xs" onClick={handleNextMonth} className="h-7 w-7 cursor-pointer hover:bg-muted">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Sun-Sat labels */}
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  {/* Calendar days grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarCells.map((cell, idx) => {
                      if (!cell.day) {
                        // Trailing placeholder cell from prev month
                        return <div key={`empty-${idx}`} className="aspect-square bg-muted/10 border border-transparent rounded-lg"></div>;
                      }

                      // Check trade counts and consolidated net return
                      const dayData = cell.dateStr ? heatmapData.dailyMap[cell.dateStr] : null;
                      const hasTrades = !!dayData && dayData.trades.length > 0;
                      const dayPnl = dayData?.pnl || 0;
                      const dayTradeCount = dayData?.trades.length || 0;

                      // Color calculations based on Zerodha style profit / loss scale
                      let bgColor = "var(--color-bg-muted, #1e293b)"; // Default theme card/muted neutral
                      let textColor = "text-muted-foreground";
                      let borderStyle = "border border-border/20";
                      let inlineStyle = {};

                      if (hasTrades) {
                        textColor = "text-white font-bold shadow-sm";
                        borderStyle = "border border-white/10 hover:border-white/30 cursor-pointer shadow-sm active:scale-95 transition-transform";
                        
                        if (dayPnl > 0) {
                          // Green profit cell (scale opacity 0.2 to 1.0 based on maximum daily profit)
                          const opacity = heatmapData.maxAbsDailyPnl > 0 
                            ? Math.max(0.25, Math.min(1.0, dayPnl / heatmapData.maxAbsDailyPnl))
                            : 0.6;
                          inlineStyle = { backgroundColor: `rgba(34, 197, 94, ${opacity})` };
                        } else if (dayPnl < 0) {
                          // Red loss cell (scale opacity 0.2 to 1.0 based on maximum daily loss)
                          const opacity = heatmapData.maxAbsDailyPnl > 0 
                            ? Math.max(0.25, Math.min(1.0, Math.abs(dayPnl) / heatmapData.maxAbsDailyPnl))
                            : 0.6;
                          inlineStyle = { backgroundColor: `rgba(239, 68, 68, ${opacity})` };
                        } else {
                          // Break-even
                          inlineStyle = { backgroundColor: `rgba(100, 116, 139, 0.5)` }; // Slate grey
                        }
                      } else {
                        // Muted inactive style matching standard dark mode card backgrounds
                        bgColor = "bg-muted/30 dark:bg-muted/20";
                        borderStyle = "border border-border/10";
                      }

                      return (
                        <div
                          key={`cell-${cell.day}`}
                          onClick={() => {
                            if (hasTrades && cell.dateStr && dayData) {
                              setSelectedDayTrades({
                                dateStr: cell.dateStr,
                                trades: dayData.trades
                              });
                            }
                          }}
                          style={inlineStyle}
                          className={`aspect-square rounded-lg flex flex-col justify-between p-1.5 transition-all text-xs relative group ${bgColor} ${textColor} ${borderStyle}`}
                        >
                          <span className="text-[10px] leading-none text-white/90">{cell.day}</span>
                          {hasTrades && (
                            <span className="text-[9px] self-end opacity-95">
                              ₹{dayPnl > 0 ? "+" : ""}{dayPnl >= 1000 ? `${(dayPnl/1000).toFixed(1)}k` : dayPnl.toFixed(0)}
                            </span>
                          )}

                          {/* Hover tooltip built completely inside pure CSS/Tailwind rendering */}
                          {hasTrades && (
                            <div className="absolute z-40 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-36 p-2 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border text-center pointer-events-none transition-opacity">
                              <div className="font-bold text-[10px] border-b pb-1 mb-1">
                                {new Date(cell.dateStr!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </div>
                              <div className={`font-extrabold ${dayPnl > 0 ? "text-green-500" : dayPnl < 0 ? "text-red-500" : ""}`}>
                                ₹{dayPnl.toFixed(2)}
                              </div>
                              <div className="text-[9px] text-muted-foreground mt-0.5">
                                {dayTradeCount} trade{dayTradeCount > 1 ? "s" : ""} logged
                              </div>
                              {/* Anchor arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-6 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 bg-muted/20 border border-border/20 rounded-md"></div>
                      <span>No Trades</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Max Loss</span>
                      <div className="flex gap-0.5">
                        <div className="w-3.5 h-3.5 rounded-sm bg-red-500/20"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-red-500/50"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-red-500/80"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-red-500"></div>
                      </div>
                      <div className="flex gap-0.5">
                        <div className="w-3.5 h-3.5 rounded-sm bg-green-500"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-green-500/80"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-green-500/50"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-green-500/20"></div>
                      </div>
                      <span>Max Profit</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Win/Loss Donut Chart Card */}
              <Card className="border-border/60 bg-card/30 backdrop-blur-sm shadow-sm flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Win / Loss Ratio
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Proportion of profitable vs unprofitable trades.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pb-8 flex-1 space-y-6">
                  {/* Donut chart generated via pure modern CSS conic-gradient */}
                  <div 
                    style={{ 
                      background: `conic-gradient(#22c55e ${metrics!.winRate}%, #ef4444 ${metrics!.winRate}% 100%)` 
                    }}
                    className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-inner group hover:scale-[1.02] transition-transform duration-300"
                  >
                    {/* Donut hole matching page background color */}
                    <div className="absolute w-32 h-32 bg-background rounded-full flex flex-col items-center justify-center p-4 border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Win Rate</span>
                      <span className="text-3xl font-extrabold text-foreground">{metrics!.winRate.toFixed(1)}%</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">
                        {metrics!.winCount} of {metrics!.totalTrades} wins
                      </span>
                    </div>
                  </div>

                  {/* Custom chart legend layout */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full max-w-[200px] text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-semibold">Wins</span>
                      <span className="text-muted-foreground ml-auto">{metrics!.winCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-semibold">Losses</span>
                      <span className="text-muted-foreground ml-auto">{metrics!.lossCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3. Detailed SVG Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Cumulative P&L curve chart */}
              <Card className="border-border/60 bg-card/30 backdrop-blur-sm shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Cumulative P&L Curve
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Growth of cumulative trade returns over the trading timeline.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {cumulativeChartPoints ? (
                    <div className="w-full">
                      {/* Responsive SVG Container */}
                      <svg viewBox="0 0 500 180" className="w-full h-auto overflow-visible" style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.2))" }}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={metrics!.totalPnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={metrics!.totalPnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Baseline at P&L = 0 */}
                        <line 
                          x1="0" 
                          y1={cumulativeChartPoints.minVal === 0 && cumulativeChartPoints.maxVal === 0 
                            ? 90 
                            : 180 - 10 - ((0 - cumulativeChartPoints.minVal) / (cumulativeChartPoints.maxVal - cumulativeChartPoints.minVal || 100)) * 160
                          }
                          x2="500" 
                          y2={cumulativeChartPoints.minVal === 0 && cumulativeChartPoints.maxVal === 0 
                            ? 90 
                            : 180 - 10 - ((0 - cumulativeChartPoints.minVal) / (cumulativeChartPoints.maxVal - cumulativeChartPoints.minVal || 100)) * 160
                          }
                          stroke="rgba(255,255,255,0.1)" 
                          strokeWidth="1" 
                          strokeDasharray="4 4" 
                        />

                        {/* Filled Area Gradient */}
                        <path d={cumulativeChartPoints.gradientPath} fill="url(#chartGradient)" />

                        {/* P&L Trend Line */}
                        <path d={cumulativeChartPoints.path} fill="none" stroke={metrics!.totalPnl >= 0 ? "#22c55e" : "#ef4444"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Data point circle indicators */}
                        {cumulativeChartPoints.points.map((pt, i) => (
                          <g key={i} className="group/dot cursor-pointer">
                            <circle cx={pt.x} cy={pt.y} r="3.5" fill={metrics!.totalPnl >= 0 ? "#22c55e" : "#ef4444"} className="hover:r-5 transition-all" />
                            {/* Inner core */}
                            <circle cx={pt.x} cy={pt.y} r="1.5" fill="white" />
                          </g>
                        ))}
                      </svg>
                      <div className="flex justify-between text-[10px] text-muted-foreground px-1 mt-3 font-semibold">
                        <span>First Trade ({new Date(heatmapData.sortedTrades[0].entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })})</span>
                        <span>Latest Trade ({new Date(heatmapData.sortedTrades[heatmapData.sortedTrades.length - 1].entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-10">
                      Not enough trade data to plot graph.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Strategy performance bar list */}
              <Card className="border-border/60 bg-card/30 backdrop-blur-sm shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Strategy Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Consolidated net P&L and win rate sorted by strategy performance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
                    {strategyData.map((item) => {
                      const maxPnl = Math.max(...strategyData.map(s => Math.abs(s.pnl)), 1);
                      const barPercentage = Math.min(100, (Math.abs(item.pnl) / maxPnl) * 100);

                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold flex items-center gap-1.5">
                              {item.name}
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-normal">
                                {item.count} trade{item.count > 1 ? "s" : ""}
                              </Badge>
                            </span>
                            <div className="space-x-3 font-semibold text-right">
                              <span className="text-[10px] text-muted-foreground">WR: {item.winRate.toFixed(0)}%</span>
                              <span className={item.pnl > 0 ? "text-green-500" : item.pnl < 0 ? "text-red-500" : ""}>
                                ₹{item.pnl.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden flex">
                            {item.pnl >= 0 ? (
                              <div className="bg-green-500 h-full rounded-full transition-all duration-300" style={{ width: `${barPercentage}%` }}></div>
                            ) : (
                              <div className="bg-red-500 h-full rounded-full transition-all duration-300" style={{ width: `${barPercentage}%` }}></div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 4. Single Day Trade Log Detailed Dialog */}
            <Dialog open={!!selectedDayTrades} onOpenChange={(open) => { if (!open) setSelectedDayTrades(null); }}>
              <DialogContent className="max-w-3xl border-border bg-card shadow-2xl overflow-hidden rounded-xl">
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Trades Logged on {selectedDayTrades && new Date(selectedDayTrades.dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </DialogTitle>
                  <DialogDescription>
                    Explore individual execution details, notes, and metrics for this day.
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-[450px] overflow-y-auto space-y-4 pt-4 pr-1">
                  {selectedDayTrades?.trades.map((trade, idx) => {
                    const tradePnl = getPnl(trade);
                    const isWin = tradePnl > 0;
                    
                    return (
                      <div key={trade.id} className="border border-border/80 rounded-xl bg-background/50 hover:bg-background/80 transition-colors p-5 space-y-4">
                        {/* Header bar of single trade card */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-base bg-muted/60 px-2.5 py-0.5 rounded-lg border">
                              {trade.symbol.toUpperCase()}
                            </span>
                            <Badge variant={trade.direction === "Long" ? "default" : "destructive"}>
                              {trade.direction}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {trade.instrumentType}
                            </Badge>
                          </div>
                          <div className={`font-extrabold text-lg ${isWin ? "text-green-500" : tradePnl < 0 ? "text-red-500" : ""}`}>
                            ₹{tradePnl > 0 ? "+" : ""}{tradePnl.toFixed(2)} ({getReturnPercent(trade).toFixed(2)}%)
                          </div>
                        </div>

                        {/* Trade stats details block */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-muted-foreground block">Execution Details</span>
                            <span className="font-semibold block">{trade.quantity} qty @ ₹{trade.entryPrice.toFixed(2)}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-muted-foreground block">Exit Details</span>
                            <span className="font-semibold block">Exit Price: ₹{trade.exitPrice.toFixed(2)}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-muted-foreground block">Strategy</span>
                            <span className="font-semibold block">{trade.strategy}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-muted-foreground block">Confidence</span>
                            <span className="font-semibold block text-primary">{trade.confidenceScore}/10</span>
                          </div>
                        </div>

                        {/* Notes and feedback tags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40 text-xs">
                          {trade.tradeIdea && (
                            <div className="space-y-1">
                              <span className="text-muted-foreground font-semibold">Trade Setup Notes:</span>
                              <p className="text-muted-foreground italic leading-relaxed">{trade.tradeIdea}</p>
                            </div>
                          )}
                          {trade.lessonLearned && (
                            <div className="space-y-1">
                              <span className="text-muted-foreground font-semibold">Lessons / Feedback:</span>
                              <p className="text-muted-foreground italic leading-relaxed text-primary">{trade.lessonLearned}</p>
                            </div>
                          )}
                        </div>

                        {/* Mistakes & Exit feedback */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          {trade.exitReason && (
                            <div className="text-xs">
                              <span className="text-muted-foreground mr-1.5">Exit Reason:</span>
                              <Badge variant="outline" className="font-normal">{trade.exitReason}</Badge>
                            </div>
                          )}
                          {trade.mistakes && trade.mistakes.length > 0 && (
                            <div className="text-xs flex items-center gap-1.5">
                              <span className="text-muted-foreground">Mistakes:</span>
                              <div className="flex flex-wrap gap-1">
                                {trade.mistakes.map(mistake => (
                                  <Badge key={mistake} variant="secondary" className="bg-destructive/10 text-destructive text-[10px] py-0 px-1.5 border border-destructive/20 font-medium">
                                    ⚠️ {mistake}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
