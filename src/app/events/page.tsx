import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, User } from "lucide-react";

const EVENTS = {
  free: [
    { id: 1, topic: "Introduction to Mutual Funds", speaker: "FinGuard Team", date: "Oct 15, 2026 - 5:00 PM" },
    { id: 2, type: "Free", topic: "Identifying Market Scams", speaker: "SEBI Guest Speaker", date: "Oct 20, 2026 - 6:00 PM" },
  ],
  paid: [
    { id: 3, topic: "Advanced Options Strategies", speaker: "P. Kamra", date: "Nov 01, 2026 - 10:00 AM", price: "₹999" },
  ]
};

export default function EventsPage() {
  const renderEvents = (events: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {events.map(event => (
        <Card key={event.id} className="flex flex-col">
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
        <div className="col-span-full py-12 text-center text-muted-foreground">
          No events scheduled at the moment.
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-10 px-4 min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto mb-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Upcoming Seminars & Webinars</h1>
        <p className="text-muted-foreground">
          Join our live sessions to enhance your market knowledge.
        </p>
      </div>

      <Tabs defaultValue="free" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="free">Free Events</TabsTrigger>
          <TabsTrigger value="paid">Paid Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="free">{renderEvents(EVENTS.free)}</TabsContent>
        <TabsContent value="paid">{renderEvents(EVENTS.paid)}</TabsContent>
      </Tabs>
    </div>
  );
}
