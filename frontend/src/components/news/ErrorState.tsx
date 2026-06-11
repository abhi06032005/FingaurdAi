import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-red-500/20 bg-red-500/5 max-w-lg mx-auto py-10 px-6 text-center shadow-xl">
      <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
        {/* Red warning icon backdrop */}
        <div className="bg-red-500/10 text-red-400 p-4 rounded-full w-14 h-14 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white tracking-tight">
            Failed to Load News
          </h3>
          <p className="text-xs text-red-300 max-w-sm leading-relaxed">
            {message || "An unexpected error occurred while fetching the latest market news."}
          </p>
        </div>

        <Button 
          onClick={onRetry}
          variant="outline"
          className="border-red-500/30 bg-red-500/10 text-white hover:bg-red-500/20 text-xs h-9 cursor-pointer flex items-center gap-1.5 rounded-xl transition-all duration-300"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry Fetching
        </Button>
      </CardContent>
    </Card>
  );
}
export default ErrorState;
