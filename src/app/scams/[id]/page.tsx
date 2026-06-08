import { getMDXContent, getAllMDXSlugs } from "@/lib/mdx";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Activity, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { Quiz } from "@/components/scams/Quiz";
import { Card, CardContent } from "@/components/ui/card";

export async function generateStaticParams() {
  const slugs = getAllMDXSlugs();
  return slugs.map((id) => ({ id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ScamDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const content = getMDXContent(id);

  if (!content) {
    notFound();
  }

  return (
    <div className="bg-[#050506] min-h-screen text-foreground pb-20">
      
      {/* Glow backdrop shadow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-200px] left-[20%] w-[40%] h-[300px] bg-violet-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-12 relative z-10 space-y-10">
        
        {/* Navigation back and header */}
        <header className="space-y-4">
          <Link href="/scams" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Scam Hub
          </Link>
          <div className="space-y-2">
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest block">
              {content.category}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {content.title}
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-3xl leading-relaxed">
              {content.description}
            </p>
          </div>
        </header>

        {/* Section 1: What is the scam */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            What is this Scam?
          </h2>
          <Card className="border-border/60 bg-card/30 backdrop-blur-sm p-6 text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
            {content.whatIsIt}
          </Card>
        </section>

        {/* Section 2: How it works step-by-step */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-violet-400" />
            How It Works (Step-by-Step)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.howItWorks.map((step, idx) => {
              const colonIdx = step.indexOf(":");
              const stepTitle = colonIdx !== -1 ? step.substring(0, colonIdx) : `Step ${idx + 1}`;
              const stepDesc = colonIdx !== -1 ? step.substring(colonIdx + 1).trim() : step;

              return (
                <div key={idx} className="border border-white/5 bg-white/5 rounded-xl p-5 space-y-2 relative group hover:border-white/10 transition-colors">
                  <div className="absolute top-4 right-4 text-3xl font-extrabold text-white/5 group-hover:text-white/10 transition-colors">
                    0{idx + 1}
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    {stepTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    {stepDesc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Grid of Red Flags and Prevention Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          {/* Red Flag Checklists */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Warning Signs (Red Flags)
            </h2>
            <Card className="border-red-500/20 bg-red-500/5 p-6 rounded-xl">
              <ul className="space-y-3.5 text-xs sm:text-sm text-gray-300 leading-relaxed">
                {content.warningSigns.map((sign, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* Prevention Checklist */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Prevention Guidelines
            </h2>
            <Card className="border-green-500/20 bg-green-500/5 p-6 rounded-xl">
              <ul className="space-y-3.5 text-xs sm:text-sm text-gray-300 leading-relaxed">
                {content.preventionTips.map((tip, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

        </div>

        {/* Real Examples Section */}
        {content.realExamples.length > 0 && (
          <section className="space-y-4 pt-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Real Example Case File
            </h2>
            <Card className="border-amber-500/20 bg-amber-500/5 p-6 rounded-xl space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed italic">
              {content.realExamples.map((example, idx) => (
                <p key={idx}>"{example}"</p>
              ))}
            </Card>
          </section>
        )}

        {/* Interactive Quiz Segment */}
        <section className="space-y-6 pt-6 border-t border-white/5">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
              <HelpCircle className="h-5.5 w-5.5 text-violet-400" />
              Test Your Knowledge
            </h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Run through our quick checkpoint questions to test if you're prepared to handle this situation.
            </p>
          </div>

          <Quiz quiz={content.quiz} />
        </section>

      </div>
    </div>
  );
}
