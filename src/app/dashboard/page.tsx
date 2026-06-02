import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, ShieldAlert, Calendar, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10 px-4 min-h-[calc(100vh-4rem)]">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your saved research, track scam reports, and view upcoming events.
        </p>
      </div>

      <Tabs defaultValue="analyses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="analyses"><TrendingUp className="w-4 h-4 mr-2" /> Analyses</TabsTrigger>
          <TabsTrigger value="scans"><ShieldAlert className="w-4 h-4 mr-2" /> Scans</TabsTrigger>
          <TabsTrigger value="articles"><Bookmark className="w-4 h-4 mr-2" /> Articles</TabsTrigger>
          <TabsTrigger value="events"><Calendar className="w-4 h-4 mr-2" /> Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analyses">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">RELIANCE</CardTitle>
                <CardDescription>Analyzed on Oct 12, 2026</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Strong retail growth, O2C margin pressure.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">Telegram VIP Tip</CardTitle>
                <CardDescription>Scanned on Oct 10, 2026</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Result: 98% Scam Probability (Pump and Dump)</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="articles">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Understanding P/E Ratio</CardTitle>
                <CardDescription>Saved 2 days ago</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identifying Market Scams</CardTitle>
                <CardDescription>Oct 20, 2026 - 6:00 PM</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-medium text-success">Registered</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
