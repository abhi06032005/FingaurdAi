import { TradeForm } from "@/components/trading-journal/trade-form";
import { BookOpen } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add New Trade | Trading Journal",
  description: "Record and analyze your trades.",
};

export default function TradingJournalPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              Add New Trade
            </h1>
            <p className="text-muted-foreground mt-1">
              Log your trade details to track your performance and analyze your setups.
            </p>
          </div>
        </header>

        <main>
          <TradeForm />
        </main>
        
      </div>
    </div>
  );
}
