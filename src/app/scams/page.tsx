import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const SCAM_TYPES = [
  { id: "pump-and-dump", title: "Pump & Dump", description: "Artificially inflating a stock's price before selling off." },
  { id: "ponzi-scheme", title: "Ponzi Scheme", description: "Paying early investors with funds from new investors." },
  { id: "fake-course", title: "Fake Trading Course", description: "Selling expensive, worthless courses with guaranteed profits." },
  { id: "telegram-vip", title: "Telegram VIP Group", description: "Paid groups promising inside information or tips." },
  { id: "fake-advisor", title: "Fake Advisor", description: "Unregistered individuals giving financial advice for a fee." },
  { id: "fake-ipo", title: "Fake IPO", description: "Selling pre-IPO shares of a non-existent or overhyped company." },
];

export default function ScamAwarenessHub() {
  return (
    <div className="container mx-auto py-10 px-4 min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto mb-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Scam Awareness Hub</h1>
        <p className="text-muted-foreground">
          Educate yourself on the most common financial scams targeting Indian retail investors.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {SCAM_TYPES.map((scam) => (
          <Card key={scam.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">{scam.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="text-sm text-foreground/80">{scam.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Link href={`/scams/${scam.id}`} className={buttonVariants({ variant: "outline", className: "w-full" })}>
                Read More
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
