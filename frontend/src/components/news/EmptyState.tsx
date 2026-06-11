import { Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card className="border-white/10 bg-slate-950/20 backdrop-blur-md max-w-lg mx-auto py-12 px-6 text-center shadow-xl">
      <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
        {/* Beautiful premium dark circular icon backdrop */}
        <div className="bg-slate-900/60 border border-white/5 text-slate-400 p-5 rounded-2xl w-16 h-16 flex items-center justify-center shadow-inner">
          <Newspaper className="h-8 w-8 stroke-[1.5]" />
        </div>
        
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-white tracking-tight">
            No news available right now
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
            {"We couldn't find any recent articles under this category. Please try checking another section or check back later."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
export default EmptyState;
