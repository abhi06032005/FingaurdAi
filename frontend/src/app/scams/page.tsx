import Link from "next/link";
import { getAllMDXSlugs, getMDXContent } from "@/lib/mdx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickDiscussion } from "@/components/scams/QuickDiscussion";
import { 
  ShieldAlert, 
  TrendingDown, 
  MessageSquare, 
  UserX, 
  Smartphone, 
  UserCheck2,
  ChevronRight,
  Sparkles,
  Activity,
  BellRing,
  FileText,
  Clock,
  AlertTriangle
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Statistics {
  totalVictims: number;
  totalLosses: number;
  verifiedReports: number;
}

interface Alert {
  id: string;
  title: string;
  description: string;
  riskLevel: string;
  status: string;
  createdAt: string;
}

interface Story {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  scamType?: string;
  lossRange?: string;
}

// ISR Server Fetch Helpers
async function getStatistics(): Promise<Statistics> {
  try {
    const res = await fetch(`${API_BASE}/scam-platform/statistics`, { 
      next: { revalidate: 10 } 
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.data;
  } catch (err) {
    return { totalVictims: 142, totalLosses: 3845000, verifiedReports: 58 };
  }
}

async function getAlerts(): Promise<Alert[]> {
  try {
    const res = await fetch(`${API_BASE}/scam-platform/alerts`, { 
      next: { revalidate: 10 } 
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    return [];
  }
}

async function getStories(): Promise<Story[]> {
  try {
    const res = await fetch(`${API_BASE}/scam-platform/stories`, { 
      next: { revalidate: 10 } 
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    return [];
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Telegram Scams":
      return <MessageSquare className="h-7 w-7 text-blue-400" />;
    case "Pump and Dump":
      return <TrendingDown className="h-7 w-7 text-red-400" />;
    case "WhatsApp Scams":
      return <MessageSquare className="h-7 w-7 text-green-400" />;
    case "Fake Advisors":
      return <UserX className="h-7 w-7 text-amber-400" />;
    case "Fake Trading Apps":
      return <Smartphone className="h-7 w-7 text-violet-400" />;
    case "Deepfake Scams":
      return <UserCheck2 className="h-7 w-7 text-fuchsia-400" />;
    default:
      return <ShieldAlert className="h-7 w-7 text-primary" />;
  }
}

const formatLoss = (loss: number) => {
  if (loss >= 10000000) {
    return `₹${(loss / 10000000).toFixed(2)} Cr`;
  }
  if (loss >= 100000) {
    return `₹${(loss / 100000).toFixed(2)} Lakhs`;
  }
  return `₹${loss.toLocaleString("en-IN")}`;
};

export default async function ScamAwarenessHub() {
  const slugs = getAllMDXSlugs();
  const categories = slugs
    .map(slug => getMDXContent(slug))
    .filter((c): c is NonNullable<typeof c> => c !== null);

  // Parallel server fetches using ISR caching
  const [stats, alerts, stories] = await Promise.all([
    getStatistics(),
    getAlerts(),
    getStories()
  ]);

  return (
    <div className="bg-[#050506] min-h-screen text-foreground pb-20 relative overflow-hidden select-none">
      
      {/* Background glow backdrops */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-200px] left-[25%] w-[40%] h-[350px] bg-red-600/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-[-100px] right-[25%] w-[40%] h-[350px] bg-violet-600/5 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-16 relative z-10 space-y-16">
        
        {/* HERO SECTION */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
            Financial Security Awareness
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-none">
            Protect Yourself From <br />
            <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
              Trading Scams
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-medium">
             retail investors lose crores daily to fake advisors, pump groups, and deepfakes. Learn how scams operate, read verified community reports, and secure your capital.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/scams/tracker" passHref>
              <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold rounded-full px-6 cursor-pointer">
                Scam Tracker Dashboard
              </Button>
            </Link>
            <Link href="/scams/report" passHref>
              <Button className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full px-6 flex items-center gap-1 cursor-pointer">
                Report a Scam <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="pt-8">
            <QuickDiscussion />
          </div>
        </div>

        {/* COMMUNITY IMPACT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <Card className="border-white/5 bg-slate-950/40 backdrop-blur-md p-6 text-left hover:border-white/10 transition-all">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Verified Victims</span>
            <div className="text-3xl font-extrabold text-white mt-1.5">{stats.totalVictims}</div>
            <p className="text-[11px] text-slate-500 mt-2">Validated claims submitted by traders.</p>
          </Card>
          
          <Card className="border-white/5 bg-slate-950/40 backdrop-blur-md p-6 text-left hover:border-white/10 transition-all">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Reported Losses</span>
            <div className="text-3xl font-extrabold text-red-500 mt-1.5">{formatLoss(stats.totalLosses)}</div>
            <p className="text-[11px] text-slate-500 mt-2">Consolidated financial impact recorded.</p>
          </Card>

          <Card className="border-white/5 bg-slate-950/40 backdrop-blur-md p-6 text-left hover:border-white/10 transition-all">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Verified Scam Cases</span>
            <div className="text-3xl font-extrabold text-white mt-1.5">{stats.verifiedReports}</div>
            <p className="text-[11px] text-slate-500 mt-2">Active scam operators identified.</p>
          </Card>
        </div>

        {/* SECTION 1: LATEST SCAM ALERTS */}
        <div className="space-y-6 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-red-500 animate-pulse" />
              Latest Scam Alerts
            </h2>
            <Link href="/scams/alerts" className="text-xs text-red-400 font-bold hover:text-white flex items-center gap-1">
              All Alerts <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alerts.length === 0 ? (
              <Card className="col-span-2 p-8 text-center text-xs text-slate-500 border-dashed border-white/5 bg-transparent">
                No active scam warnings reported recently. Stay vigilant!
              </Card>
            ) : (
              alerts.slice(0, 2).map((alert) => (
                <Card key={alert.id} className="border-white/5 bg-[#0a0a0d]/60 backdrop-blur-sm p-6 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                    <h3 className="font-bold text-sm sm:text-base text-white">{alert.title}</h3>
                    <Badge className={`text-[9px] font-bold h-4 ${
                      alert.riskLevel === "High" ? "bg-red-600" : "bg-amber-600"
                    }`}>
                      {alert.riskLevel} Risk
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed line-clamp-3">{alert.description}</p>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* SECTION 2: SCAM CATEGORIES GRID */}
        <div className="space-y-6 text-left">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            Scam Classifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((item) => (
              <Card key={item.slug} className="border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between h-[230px] group">
                <CardHeader className="space-y-3 pb-3">
                  <div className="p-2.5 bg-white/5 rounded-xl w-11 h-11 flex items-center justify-center">
                    {getCategoryIcon(item.title)}
                  </div>
                  <CardTitle className="text-base font-extrabold text-white group-hover:text-red-400 transition-colors">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 text-left">
                  <CardDescription className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {item.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="border-t border-white/5 pt-3">
                  <Link href={`/scams/${item.slug}`} className="w-full" passHref>
                    <Button variant="ghost" className="w-full text-[11px] font-bold text-gray-400 hover:text-white flex items-center justify-center gap-1 hover:bg-white/5 h-8">
                      Prevention Guide <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 3: VERIFIED SCAM STORIES */}
        <div className="space-y-6 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" />
              Verified Victim Stories
            </h2>
            <Link href="/scams/stories" className="text-xs text-violet-400 font-bold hover:text-white flex items-center gap-1">
              All Stories <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stories.length === 0 ? (
              <Card className="col-span-3 p-8 text-center text-xs text-slate-500 border-dashed border-white/5 bg-transparent">
                No victim stories verified yet. Verification process pending.
              </Card>
            ) : (
              stories.slice(0, 3).map((story) => (
                <Card key={story.id} className="border-white/5 bg-[#0a0a0d]/60 backdrop-blur-sm p-5 flex flex-col justify-between hover:border-white/10 transition-colors h-[210px]">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-bold py-0 h-4">
                        🛡️ Verified Account
                      </Badge>
                      {story.scamType && (
                        <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold py-0 h-4">
                          {story.scamType}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-extrabold text-sm text-white line-clamp-1">{story.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{story.summary}</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 pt-3 mt-3 font-semibold">
                    <span>Anonymous</span>
                    <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* SECTION 4: REPORT SCAM CTA BANNER */}
        <section className="pt-4">
          <div className="rounded-3xl bg-gradient-to-r from-red-950/20 to-amber-950/10 border border-red-500/15 p-8 md:p-12 text-center space-y-5 relative overflow-hidden">
            <div className="absolute top-[20%] left-[30%] w-[40%] h-[120px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              Have you been target of a financial scam?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
              Help us protect the community. File an anonymous report with screenshot evidence. Your personal contact details will never be exposed.
            </p>
            <div className="pt-2 flex justify-center max-w-xs mx-auto">
              <Link href="/scams/report" passHref className="w-full">
                <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-full cursor-pointer shadow-lg flex items-center justify-center gap-1.5">
                  Report Scam Now <ChevronRight className="h-4.5 w-4.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
