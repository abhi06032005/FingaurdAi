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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {articles.map(article => (
        <Link href={`/learn/${article.id}`} key={article.id}>
          <Card className="hover:shadow-md transition-shadow h-full cursor-pointer">
            <div className="h-32 bg-muted rounded-t-lg flex items-center justify-center border-b">
              <BookOpen className="text-muted-foreground w-8 h-8 opacity-50" />
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
    <div className="container mx-auto py-10 px-4 min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto mb-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Financial Library</h1>
        <p className="text-muted-foreground">
          Master the art of investing with our curated guides and tutorials.
        </p>
      </div>

      <Tabs defaultValue="beginner" className="w-full max-w-5xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="beginner">Beginner</TabsTrigger>
          <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="beginner">{renderArticles(ARTICLES.beginner)}</TabsContent>
        <TabsContent value="intermediate">{renderArticles(ARTICLES.intermediate)}</TabsContent>
        <TabsContent value="advanced">{renderArticles(ARTICLES.advanced)}</TabsContent>
      </Tabs>
    </div>
  );
}
