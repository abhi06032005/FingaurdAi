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
    <div className="fg-shell flex h-[calc(100vh-4rem)] flex-col px-4 py-8">
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
        <div className="mb-6 text-center">
          <div aria-hidden className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            <Bot className="h-6 w-6" />
          </div>
          <h1 className="fg-title mb-2 text-3xl md:text-5xl">AI Learning Assistant</h1>
          <p className="text-muted-foreground">Ask questions, request roadmaps, and learn at your own pace.</p>
        </div>

        <div className="mb-6 flex-1 space-y-4 overflow-y-auto rounded-lg border border-border/70 bg-card/40 p-4 pr-2 shadow-inner backdrop-blur-md">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex-shrink-0 rounded-lg p-2 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`max-w-[80%] rounded-lg border p-4 shadow-sm ${msg.role === "user" ? "border-primary/30 bg-primary text-primary-foreground" : "border-border/70 bg-background/70 text-foreground"}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="mt-8 grid grid-cols-1 gap-4 px-0 sm:grid-cols-2 sm:px-12">
              <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:border-primary/35" onClick={() => setInput("Create a roadmap for a complete beginner with â‚¹10,000 to invest.")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center text-primary"><MapPin className="w-4 h-4 mr-2" /> Beginner Roadmap</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Step-by-step guide to starting your investment journey safely.
                </CardContent>
              </Card>
              <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:border-primary/35" onClick={() => setInput("Explain the difference between Nifty 50 and Sensex.")}>
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

        <form onSubmit={handleSend} className="flex gap-2 rounded-lg border border-border/70 bg-card/70 p-2 shadow-xl backdrop-blur-md">
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
    </div>
  );
}
