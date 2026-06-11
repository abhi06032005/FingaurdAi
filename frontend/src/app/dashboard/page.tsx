import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, ShieldAlert, Calendar, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="fg-shell min-h-[calc(100vh-4rem)] px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="fg-panel rounded-lg p-6 md:p-8">
          <div aria-hidden className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            <Bookmark className="h-5 w-5" />
          </div>
          <h1 className="fg-title text-3xl md:text-4xl">My Dashboard</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Manage your saved research, track scam reports, and view upcoming events.
          </p>
        </div>

        <Tabs defaultValue="analyses" className="w-full">
          <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4">
            <TabsTrigger value="analyses" className="py-2.5"><TrendingUp className="w-4 h-4 mr-2" /> Analyses</TabsTrigger>
            <TabsTrigger value="scans" className="py-2.5"><ShieldAlert className="w-4 h-4 mr-2" /> Scans</TabsTrigger>
            <TabsTrigger value="articles" className="py-2.5"><Bookmark className="w-4 h-4 mr-2" /> Articles</TabsTrigger>
            <TabsTrigger value="events" className="py-2.5"><Calendar className="w-4 h-4 mr-2" /> Events</TabsTrigger>
          </TabsList>
        
          <TabsContent value="analyses">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="relative overflow-hidden">
                <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-primary" />
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="border-destructive/50 bg-destructive/5">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Understanding P/E Ratio</CardTitle>
                  <CardDescription>Saved 2 days ago</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
    </div>
  );
}
