import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, User } from "lucide-react";

type EventItem = {
  id: number;
  type?: string;
  topic: string;
  speaker: string;
  date: string;
  price?: string;
};

const EVENTS: { free: EventItem[]; paid: EventItem[] } = {
  free: [
    { id: 1, topic: "Introduction to Mutual Funds", speaker: "FinGuard Team", date: "Oct 15, 2026 - 5:00 PM" },
    { id: 2, type: "Free", topic: "Identifying Market Scams", speaker: "SEBI Guest Speaker", date: "Oct 20, 2026 - 6:00 PM" },
  ],
  paid: [
    { id: 3, topic: "Advanced Options Strategies", speaker: "P. Kamra", date: "Nov 01, 2026 - 10:00 AM", price: "₹999" },
  ]
};

export default function EventsPage() {
  const renderEvents = (events: EventItem[]) => (
    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
      {events.map(event => (
        <Card key={event.id} className="flex flex-col transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">{event.topic}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 text-muted-foreground">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-primary" /> 
              <span className="text-sm font-medium">{event.speaker}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-primary" /> 
              <span className="text-sm">{event.date}</span>
            </div>
            {event.price && (
              <div className="mt-4 text-foreground font-semibold">
                Entry: {event.price}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full">Register Now</Button>
          </CardFooter>
        </Card>
      ))}
      {events.length === 0 && (
        <div className="col-span-full rounded-lg border border-dashed border-border/80 bg-card/40 py-12 text-center text-muted-foreground">
          No events scheduled at the moment.
        </div>
      )}
    </div>
  );

  return (
    <div className="fg-shell min-h-[calc(100vh-4rem)] px-4 py-10">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <div aria-hidden className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
          <Calendar className="h-6 w-6" />
        </div>
        <h1 className="fg-title mb-4 text-3xl md:text-5xl">Upcoming Seminars & Webinars</h1>
        <p className="text-muted-foreground">
          Join our live sessions to enhance your market knowledge.
        </p>
      </div>

      <Tabs defaultValue="free" className="mx-auto w-full max-w-4xl">
        <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-1">
          <TabsTrigger value="free" className="py-2.5">Free Events</TabsTrigger>
          <TabsTrigger value="paid" className="py-2.5">Paid Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="free">{renderEvents(EVENTS.free)}</TabsContent>
        <TabsContent value="paid">{renderEvents(EVENTS.paid)}</TabsContent>
      </Tabs>
    </div>
  );
}
