import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock } from "lucide-react";
import Link from "next/link";

const ARTICLES = {
  beginner: [
    { id: 1, title: "What is the Stock Market?", time: "5 min", tags: ["Basics"] },
    { id: 2, title: "Understanding SIPs and Mutual Funds", time: "8 min", tags: ["Investing"] },
  ],
  intermediate: [
    { id: 3, title: "How to Read a Balance Sheet", time: "12 min", tags: ["Analysis"] },
    { id: 4, title: "Understanding P/E Ratio & Valuations", time: "10 min", tags: ["Valuation"] },
  ],
  advanced: [
    { id: 5, title: "Options Trading: Greeks Explained", time: "15 min", tags: ["Derivatives"] },
    { id: 6, title: "Algorithmic Trading Basics", time: "20 min", tags: ["Algo"] },
  ]
};

export default function LearnPage() {
  const renderArticles = (articles: typeof ARTICLES.beginner) => (
    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {articles.map(article => (
        <Link href={`/learn/${article.id}`} key={article.id}>
          <Card className="h-full cursor-pointer transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl">
            <div className="flex h-36 items-center justify-center border-b border-border/70 bg-gradient-to-br from-primary/10 via-background/40 to-accent/10">
              <BookOpen className="w-9 h-9 text-primary" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {article.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="text-muted-foreground text-sm flex items-center">
              <Clock className="w-4 h-4 mr-1" /> {article.time} read
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="fg-shell min-h-[calc(100vh-4rem)] px-4 py-10">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <div aria-hidden className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
          <BookOpen className="h-6 w-6" />
        </div>
        <h1 className="fg-title mb-4 text-3xl md:text-5xl">Financial Library</h1>
        <p className="text-muted-foreground">
          Master the art of investing with our curated guides and tutorials.
        </p>
      </div>

      <Tabs defaultValue="beginner" className="mx-auto w-full max-w-5xl">
        <TabsList className="mb-8 grid h-auto w-full grid-cols-3 gap-1">
          <TabsTrigger value="beginner" className="py-2.5">Beginner</TabsTrigger>
          <TabsTrigger value="intermediate" className="py-2.5">Intermediate</TabsTrigger>
          <TabsTrigger value="advanced" className="py-2.5">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="beginner">{renderArticles(ARTICLES.beginner)}</TabsContent>
        <TabsContent value="intermediate">{renderArticles(ARTICLES.intermediate)}</TabsContent>
        <TabsContent value="advanced">{renderArticles(ARTICLES.advanced)}</TabsContent>
      </Tabs>
    </div>
  );
}
