"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default function ScamStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scam-platform/stories`);
        const result = await res.json();
        
        if (res.ok) {
          setStories(result.data || []);
        } else {
          setError(result.error || "Failed to fetch stories.");
        }
      } catch (err: any) {
        console.error(err);
        setError("Error connecting to the verification server.");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  return (
    <div className="bg-[#050506] min-h-screen text-foreground pb-20">
      
      {/* Background shadow glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[450px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-150px] left-[30%] w-[40%] h-[300px] bg-violet-600/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-16 relative z-10 space-y-8">
        
        <header className="space-y-4">
          <Link href="/scams/tracker" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Tracker
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="h-8 w-8 text-green-500" />
              Verified Scam Stories
            </h1>
            <p className="text-sm text-gray-400">
              Explore documented, anonymous experiences of victims to learn from their mistakes and safeguard your funds.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-44 bg-muted rounded-xl"></div>
            <div className="h-44 bg-muted rounded-xl"></div>
            <div className="h-44 bg-muted rounded-xl"></div>
          </div>
        ) : error ? (
          <Card className="border-destructive/30 bg-destructive/5 text-destructive p-6 rounded-xl flex items-center gap-4">
            <AlertCircle className="h-10 w-10 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Failed to load stories</h3>
              <p className="text-muted-foreground mt-1">{error}</p>
            </div>
          </Card>
        ) : stories.length === 0 ? (
          <Card className="text-center py-20 border border-white/5 bg-card/20 rounded-2xl max-w-lg mx-auto space-y-4">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-lg text-white">No stories verified yet</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              We verify and publish victim stories anonymously after proper documentation check from our support analyst team.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story) => (
              <Card key={story.id} className="border-border/60 bg-card/35 backdrop-blur-sm shadow-md hover:border-border transition-all flex flex-col justify-between h-[230px] p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-bold py-0 h-4">
                      🛡️ Verified Account
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
                  <h3 className="font-extrabold text-base text-white tracking-tight leading-snug line-clamp-1">{story.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-5">{story.summary}</p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 pt-3 mt-4 font-semibold">
                  <span>Anonymous Victim</span>
                  <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
