import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, TrendingUp, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 py-20 px-4 flex flex-col items-center justify-center text-center space-y-8 bg-slate-50 dark:bg-slate-900 border-b">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl">
          Learn Investing. <span className="text-primary">Analyze Stocks.</span> Avoid Scams.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          AI-powered financial literacy and scam awareness platform for Indian investors. Equip yourself with data, not hype.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/stocks" className={buttonVariants({ size: "lg", className: "px-8" })}>
            Analyze a Stock
          </Link>
          <Link href="/scanner" className={buttonVariants({ size: "lg", variant: "outline", className: "px-8" })}>
            Scan a Message
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-4 container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <TrendingUp className="w-10 h-10 mb-4 text-primary" />
              <CardTitle>AI Stock Analyzer</CardTitle>
              <CardDescription>
                Get instant, unbiased analysis of any NSE/BSE stock. We decode the financials so you don't have to.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <ShieldAlert className="w-10 h-10 mb-4 text-destructive" />
              <CardTitle>Scam Scanner</CardTitle>
              <CardDescription>
                Paste suspicious Telegram tips or WhatsApp forwards. Our AI detects red flags and pump-and-dump schemes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="w-10 h-10 mb-4 text-success" />
              <CardTitle>Financial Literacy</CardTitle>
              <CardDescription>
                Learn the fundamentals of investing through interactive AI roadmaps and expert-curated articles.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Quick Statistics / Trust Section */}
      <section className="bg-primary text-primary-foreground py-16 px-4">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-5xl font-bold mb-2">500+</div>
            <div className="text-primary-foreground/80 text-sm uppercase tracking-wider">Stocks Analyzed</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-bold mb-2">1.2K</div>
            <div className="text-primary-foreground/80 text-sm uppercase tracking-wider">Scams Detected</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-bold mb-2">50K+</div>
            <div className="text-primary-foreground/80 text-sm uppercase tracking-wider">Investors Educated</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-bold mb-2">100%</div>
            <div className="text-primary-foreground/80 text-sm uppercase tracking-wider">Unbiased AI</div>
          </div>
        </div>
      </section>
    </div>
  );
}
