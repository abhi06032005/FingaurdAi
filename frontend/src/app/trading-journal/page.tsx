import { TradeForm } from "@/components/trading-journal/trade-form";
import { BookOpen, BarChart3 } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Add New Trade | Trading Journal",
  description: "Record and analyze your trades.",
};

export default function TradingJournalPage() {
  return (
    <div className="fg-shell min-h-screen pb-20 text-foreground">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        
        <header className="fg-panel flex flex-col items-start justify-between gap-4 rounded-lg p-6 sm:flex-row sm:items-center md:p-8">
          <div>
            <h1 className="fg-title flex items-center gap-3 text-3xl md:text-4xl">
              <BookOpen className="h-8 w-8 text-primary" />
              Add New Trade
            </h1>
            <p className="text-muted-foreground mt-1">
              Log your trade details to track your performance and analyze your setups.
            </p>
          </div>
          <Link href="/trading-journal/analysis" passHref>
            <Button size="lg" className="flex items-center gap-2 cursor-pointer shadow-sm">
              <BarChart3 className="h-5 w-5" />
              Analyze Trade History
            </Button>
          </Link>
        </header>

        <main>
          <TradeForm />
        </main>
        
      </div>
    </div>
  );
}
