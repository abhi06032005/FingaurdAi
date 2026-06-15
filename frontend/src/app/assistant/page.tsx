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
          <div aria-hidden className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
            <Bot className="h-6 w-6" />
          </div>
          <h1 className="fg-title mb-2 text-3xl md:text-5xl">AI Learning Assistant</h1>
          <p className="text-muted-foreground text-sm">Ask questions, request roadmaps, and learn at your own pace.</p>
        </div>

        <div className="mb-6 flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-card/60 p-5 pr-3 shadow-sm backdrop-blur-md">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex-shrink-0 rounded-lg p-2 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground border border-border"}`}>
                {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`max-w-[80%] rounded-xl border p-4 shadow-sm text-sm leading-relaxed ${msg.role === "user" ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="mt-8 grid grid-cols-1 gap-4 px-0 sm:grid-cols-2 sm:px-12">
              <Card className="cursor-pointer border-border/80 bg-background/50 hover:bg-background transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" onClick={() => setInput("Create a roadmap for a complete beginner with ₹10,000 to invest.")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center text-primary font-bold"><MapPin className="w-4 h-4 mr-2" /> Beginner Roadmap</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-normal">
                  Step-by-step guide to starting your investment journey safely.
                </CardContent>
              </Card>
              <Card className="cursor-pointer border-border/80 bg-background/50 hover:bg-background transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" onClick={() => setInput("Explain the difference between Nifty 50 and Sensex.")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center text-primary font-bold"><Bot className="w-4 h-4 mr-2" /> Concept Explanation</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-normal">
                  Simplify complex jargon into easy-to-understand language.
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 rounded-xl border border-border bg-card/70 p-2 shadow-md backdrop-blur-md">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 bg-background/50 border-border focus-visible:ring-primary/50 rounded-lg"
          />
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-4 shadow-sm cursor-pointer transition-colors duration-150">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
