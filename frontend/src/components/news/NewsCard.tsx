import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { NewsArticle } from "@/services/newsApi";

interface NewsCardProps {
  article: NewsArticle;
}

// Beautiful stock-market/finance stock photo from Unsplash to act as fallback
const FALLBACK_IMAGE_URL = "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=60";

/**
 * Calculates a user-friendly relative time string
 */
function formatTimeAgo(dateStr: string): string {
  try {
    const published = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - published.getTime();
    
    if (isNaN(diffMs)) return "Recent";
    
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const days = Math.floor(diffHours / 24);
      return `${days}d ago`;
    }
  } catch {
    return "Recent";
  }
}

export function NewsCard({ article }: NewsCardProps) {
  const timeAgo = formatTimeAgo(article.publishedAt);
  const imageUrl = article.image || FALLBACK_IMAGE_URL;

  // Handle missing image on dynamic load errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = FALLBACK_IMAGE_URL;
  };

  return (
    <a 
      href={article.link} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="group block outline-none"
    >
      <Card className="border-white/10 bg-slate-950/40 backdrop-blur-xl flex flex-col justify-between h-[420px] overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:bg-slate-900/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer">
        {/* Card Thumbnail Image */}
        <div className="relative w-full h-44 overflow-hidden border-b border-white/5 bg-slate-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl} 
            alt={article.title}
            onError={handleImageError}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent"></div>
        </div>

        {/* Card Header metadata */}
        <CardHeader className="p-4 pb-2 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-emerald-400 uppercase tracking-wider bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
              {article.source || "Google News"}
            </span>
            <span className="text-slate-400 font-semibold">
              {timeAgo}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight line-clamp-2 pt-1 group-hover:text-emerald-300 transition-colors">
            {article.title}
          </h3>
        </CardHeader>

        {/* Card Content body */}
        <CardContent className="p-4 pt-0 pb-2">
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
            {article.description || "No summary description available for this article."}
          </p>
        </CardContent>

        {/* Card Footer action indicators */}
        <CardFooter className="p-4 pt-0 border-t border-white/5 flex items-center justify-between mt-auto text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
          <span>Read Article</span>
          <span className="bg-white/5 p-1.5 rounded-full border border-white/10 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all duration-300">
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </CardFooter>
      </Card>
    </a>
  );
}
