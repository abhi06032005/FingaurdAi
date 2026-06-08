"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

const INFLUENCERS = [
  { id: 1, name: "Pranjal Kamra", platform: "YouTube", rating: 4.8, description: "Value investing and fundamental analysis simplified.", reviews: 1450 },
  { id: 2, name: "Akshat Shrivastava", platform: "YouTube", rating: 4.5, description: "Global macroeconomics and stock breakdowns.", reviews: 980 },
  { id: 3, name: "Crypto Expert India", platform: "Twitter", rating: 2.1, description: "Calls for altcoins and daily signals. High risk.", reviews: 340 },
];

export default function InfluencersPage() {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? INFLUENCERS : INFLUENCERS.filter(i => i.platform === filter);

  return (
    <div className="container mx-auto py-10 px-4 min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto mb-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Finfluencer Directory</h1>
        <p className="text-muted-foreground">
          Community-driven reviews and ratings for popular financial influencers.
        </p>
      </div>

      <div className="flex justify-center space-x-2 mb-8">
        {["All", "YouTube", "Twitter", "Instagram"].map(p => (
          <Badge 
            key={p} 
            variant={filter === p ? "default" : "outline"}
            className="cursor-pointer text-sm py-1 px-4"
            onClick={() => setFilter(p)}
          >
            {p}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filtered.map(influencer => (
          <Card key={influencer.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${influencer.name}`} alt={influencer.name} />
                <AvatarFallback>{influencer.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{influencer.name}</CardTitle>
                <CardDescription>{influencer.platform}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <p className="text-sm text-foreground/80">{influencer.description}</p>
              
              <div className="flex items-center gap-2 pt-2 border-t">
                <div className="flex items-center text-warning">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  <span className="font-bold text-foreground">{influencer.rating}</span>
                </div>
                <span className="text-muted-foreground text-xs">({influencer.reviews} reviews)</span>
                {influencer.rating < 3 && (
                  <Badge variant="destructive" className="ml-auto text-[10px]">Low Trust</Badge>
                )}
                {influencer.rating >= 4.5 && (
                  <Badge variant="secondary" className="ml-auto text-[10px] text-success border-success/30">Verified</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
