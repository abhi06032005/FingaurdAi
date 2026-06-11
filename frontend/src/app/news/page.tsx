"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, Sparkles, TrendingUp } from "lucide-react";
import { fetchNewsByCategory } from "@/services/newsApi";
import { NewsTabs } from "@/components/news/NewsTabs";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsSkeleton } from "@/components/news/NewsSkeleton";
import { EmptyState } from "@/components/news/EmptyState";
import { ErrorState } from "@/components/news/ErrorState";

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // TanStack Query configuration:
  // - enabled: only queries when activeTab is not null (not on initial load)
  // - staleTime: 2 hours (7,200,000 ms) as per requirements
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["news", activeTab],
    queryFn: () => fetchNewsByCategory(activeTab!),
    enabled: !!activeTab,
    staleTime: 2 * 60 * 60 * 1000, // 2 hours
  });

  const articles = data?.data || [];

  return (
    <div className="bg-[#050506] text-foreground min-h-screen overflow-x-hidden font-sans selection:bg-emerald-500/30 selection:text-white pb-20">
      
      {/* Background shadow glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-200px] left-[20%] w-[40%] h-[350px] bg-emerald-600/10 rounded-full blur-[140px] md:blur-[180px]"></div>
        <div className="absolute top-[-100px] right-[20%] w-[35%] h-[350px] bg-cyan-600/10 rounded-full blur-[140px] md:blur-[180px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-16 space-y-10">
        
        {/* Page Header */}
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            FinGuard intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Market News
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed font-medium">
            Stay ahead of the trend with institutional-grade financial reporting, corporate announcements, and regulatory bulletins aggregated from trusted feeds.
          </p>
        </header>

        {/* Tab Category Navigation */}
        <NewsTabs activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId)} />

        {/* Dynamic Content Display area */}
        <main className="pt-4 min-h-[400px]">
          {/* Case 1: Initial Load State (User has not selected a tab yet) */}
          {!activeTab && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-white/5 rounded-2xl bg-slate-950/20 max-w-2xl mx-auto px-6">
              <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-full w-14 h-14 flex items-center justify-center animate-bounce">
                <Newspaper className="h-6.5 w-6.5 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Select a news category</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Click on any of the category tabs above to fetch the latest parsed market feeds from MongoDB.
                </p>
              </div>
            </div>
          )}

          {/* Case 2: Loading Skeleton State */}
          {activeTab && isLoading && <NewsSkeleton />}

          {/* Case 3: Error Handling State */}
          {activeTab && error && (
            <ErrorState 
              message={error instanceof Error ? error.message : "Failed to load articles."} 
              onRetry={refetch} 
            />
          )}

          {/* Case 4: Success - Empty Data State */}
          {activeTab && !isLoading && !error && articles.length === 0 && (
            <EmptyState />
          )}

          {/* Case 5: Success - Articles Grid Render */}
          {activeTab && !isLoading && !error && articles.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 pb-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Showing latest {articles.length} publications
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                {articles.map((article) => (
                  <NewsCard key={article._id} article={article} />
                ))}
              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
