"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink,
  Info,
  AlertCircle,
  FileCode,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
}

export default function AIAssistancePage() {
  const { userId, isLoaded, getToken } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch trades on component mount
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

  // Format trade data: filter internal DB keys to optimize prompt length
  const formattedJSON = useMemo(() => {
    if (trades.length === 0) return "[]";

    const cleanTrades = trades.map(({ 
      symbol, 
      instrumentType, 
      direction, 
      entryPrice, 
      exitPrice, 
      quantity, 
      entryDate, 
      exitDate, 
      strategy, 
      confidenceScore,
      emotion,
      exitReason,
      mistakes,
      tradeIdea,
      lessonLearned,
      optionType,
      strikePrice,
      expiryDate,
      premiumPaid
    }) => {
      // Calculate net P&L
      const pnl = direction === "Long" 
        ? (exitPrice - entryPrice) * quantity 
        : (entryPrice - exitPrice) * quantity;

      return {
        symbol,
        instrument: instrumentType,
        direction,
        qty: quantity,
        entryPrice,
        exitPrice,
        pnl: Number(pnl.toFixed(2)),
        entryDate: entryDate ? new Date(entryDate).toLocaleDateString() : "",
        exitDate: exitDate ? new Date(exitDate).toLocaleDateString() : "",
        strategy,
        confidence: confidenceScore,
        emotion: emotion || undefined,
        exitReason: exitReason || undefined,
        mistakes: mistakes.length > 0 ? mistakes : undefined,
        notes: tradeIdea || undefined,
        lesson: lessonLearned || undefined,
        optionDetails: instrumentType === "Options" ? { type: optionType, strike: strikePrice, expiry: expiryDate ? new Date(expiryDate).toLocaleDateString() : undefined, premium: premiumPaid } : undefined
      };
    });

    return JSON.stringify(cleanTrades, null, 2);
  }, [trades]);

  // Combined AI System Instruction + Data Prompt
  const customPromptText = useMemo(() => {
    return `You are FinGuard AI's Elite Trading Coach. Below is my trading journal history in JSON format. 

Analyze this data and provide a comprehensive performance report:
1. Identify my best and worst performing setups (Win Rate, Net P&L per symbol/instrument/strategy).
2. Spot recurring cognitive biases or errors (review the 'emotion' and 'mistakes' logs).
3. Review my risk-to-reward ratio discipline and confidence alignment.
4. Give 3 critical, actionable trading rules to improve my profitability based directly on this data.

Keep the advice direct, realistic, and formatted in clean Markdown.

---
TRADE JOURNAL JSON DATA:
${formattedJSON}`;
  }, [formattedJSON]);

  // Handle Clipboard Copy
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(customPromptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

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
              Please log in to export and analyze your trade history with AI assistance.
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

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header Section */}
        <header className="space-y-1 pb-6 border-b border-border">
          <Link href="/trading-journal/analysis" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Analytics
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            <Sparkles className="h-8 w-8 text-violet-500" />
            Analyze Performance with AI
          </h1>
          <p className="text-muted-foreground">
            Generate and copy a professional trading coach prompt containing your condensed trade log history to paste directly into ChatGPT.
          </p>
        </header>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded-md w-1/4"></div>
            <div className="h-44 bg-muted rounded-md"></div>
            <div className="h-96 bg-muted rounded-md"></div>
          </div>
        ) : error ? (
          <Card className="border-destructive/30 bg-destructive/5 text-destructive p-6 rounded-xl flex items-center gap-4">
            <AlertCircle className="h-10 w-10 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Unable to prepare prompt</h3>
              <p className="text-muted-foreground mt-1">{error}</p>
            </div>
          </Card>
        ) : trades.length === 0 ? (
          <Card className="text-center py-12 border border-muted bg-card/20 rounded-2xl max-w-lg mx-auto space-y-4">
            <Info className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-lg">No trades to analyze</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Please log some trades in your journal before initiating AI analysis.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            
            {/* Guide Step Banner */}
            <div className="flex gap-4 p-4 border rounded-xl bg-violet-600/5 border-violet-500/20 text-sm leading-relaxed">
              <Info className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-violet-400 mb-1">How it works</h4>
                <p className="text-muted-foreground">
                  Open AI tools like ChatGPT or Claude, copy the pre-built prompt containing your anonymized trade database history from below, and paste it. The prompt instructs the AI to run advanced analytics on your data and highlight growth rules tailored to your style.
                </p>
              </div>
            </div>

            {/* Prompt Code Block Interface */}
            <Card className="border-border/60 bg-card/30 backdrop-blur-sm shadow-md overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-violet-500" />
                    ChatGPT / Claude System Prompt & Data
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Contains anonymized symbol entries, timestamps, returns, strategies, and logged cognitive behaviors.
                  </CardDescription>
                </div>

                {/* Combined Copy Action */}
                <Button 
                  onClick={handleCopyPrompt} 
                  className={`flex items-center gap-1.5 cursor-pointer shadow-sm font-semibold transition-all ${
                    copied 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-violet-600 hover:bg-violet-700 text-white"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Prompt & Data
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative">
                  <pre className="max-h-[400px] overflow-y-auto p-5 text-xs font-mono bg-[#050505] text-gray-300 leading-relaxed rounded-b-xl whitespace-pre-wrap">
                    {customPromptText}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Navigation and Redirect Controller */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-border/50">
              <Link href="/trading-journal/analysis" passHref>
                <Button variant="outline" className="w-full sm:w-auto font-semibold">
                  Back to Performance
                </Button>
              </Link>
              <Button 
                onClick={() => {
                  window.open("https://chatgpt.com", "_blank", "noopener,noreferrer");
                }}
                className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                Go to ChatGPT
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
