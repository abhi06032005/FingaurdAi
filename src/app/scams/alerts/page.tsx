"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BellRing, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: string;
  title: string;
  description: string;
  riskLevel: string;
  status: string;
  createdAt: string;
}

export default function ScamAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scam-platform/alerts`);
        const result = await res.json();
        
        if (res.ok) {
          setAlerts(result.data || []);
        } else {
          setError(result.error || "Failed to fetch alerts.");
        }
      } catch (err: any) {
        console.error(err);
        setError("Error connecting to the alert monitoring servers.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <div className="bg-[#050506] min-h-screen text-foreground pb-20">
      
      {/* Background shadow glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[450px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-150px] left-[30%] w-[40%] h-[300px] bg-red-600/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-16 relative z-10 space-y-8">
        
        <header className="space-y-4">
          <Link href="/scams/tracker" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Tracker
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <BellRing className="h-8 w-8 text-red-500 animate-pulse" />
              Scam Alerts Feed
            </h1>
            <p className="text-sm text-gray-400">
              Active warnings, pump channels, and fraudulent apps currently under investigation or closed by the community.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-muted rounded-xl"></div>
            <div className="h-32 bg-muted rounded-xl"></div>
            <div className="h-32 bg-muted rounded-xl"></div>
          </div>
        ) : error ? (
          <Card className="border-destructive/30 bg-destructive/5 text-destructive p-6 rounded-xl flex items-center gap-4">
            <AlertCircle className="h-10 w-10 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Failed to load alerts feed</h3>
              <p className="text-muted-foreground mt-1">{error}</p>
            </div>
          </Card>
        ) : alerts.length === 0 ? (
          <Card className="text-center py-20 border border-white/5 bg-card/20 rounded-2xl max-w-lg mx-auto space-y-4">
            <BellRing className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-lg text-white">No active alerts</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              No scams are currently reported under investigation or verified by our security audit team. Check back soon.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {alerts.map((alert) => (
              <Card key={alert.id} className="border-border/60 bg-card/35 backdrop-blur-sm p-6 hover:border-border transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-base sm:text-lg text-white">{alert.title}</h3>
                    <Badge className={`text-[10px] font-bold py-0 h-4.5 px-2 ${
                      alert.riskLevel === "High" 
                        ? "bg-red-600 text-white" 
                        : alert.riskLevel === "Medium" 
                        ? "bg-amber-600 text-white" 
                        : "bg-green-600 text-white"
                    }`}>
                      {alert.riskLevel} Risk Level
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">
                    Reported on {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">{alert.description}</p>
                
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4 text-[10px] text-gray-500 font-bold">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">ALERT STATUS:</span>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider h-5 border-white/10 font-bold">
                      {alert.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
