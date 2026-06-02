"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Bot, User, MapPin } from "lucide-react";

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your FinGuard AI Learning Assistant. Do you want me to explain a financial concept or generate a learning roadmap for you?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages([...messages, { role: "user", content: input }]);
    setInput("");

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm a mock AI for now! Once connected to the backend, I'll explain concepts, build personalized roadmaps, and decode complex financial jargon for you."
      }]);
    }, 1000);
  };

  return (
    <div className="container mx-auto py-10 px-4 flex flex-col h-[calc(100vh-4rem)] max-w-4xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">AI Learning Assistant</h1>
        <p className="text-muted-foreground">Ask questions, request roadmaps, and learn at your own pace.</p>
      </div>

      <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`p-2 rounded-full flex-shrink-0 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`p-4 rounded-lg max-w-[80%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {messages.length === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 px-12">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setInput("Create a roadmap for a complete beginner with ₹10,000 to invest.")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center text-primary"><MapPin className="w-4 h-4 mr-2" /> Beginner Roadmap</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Step-by-step guide to starting your investment journey safely.
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setInput("Explain the difference between Nifty 50 and Sensex.")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center text-primary"><Bot className="w-4 h-4 mr-2" /> Concept Explanation</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Simplify complex jargon into easy-to-understand language.
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 bg-background pt-4 border-t">
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..." 
          className="flex-1"
        />
        <Button type="submit">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
