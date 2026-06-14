"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant" | "error";
  content: string;
  timestamp?: string;
}

interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}

export default function TradeSpacePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<HistoryItem[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(5);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // Auto-resize textarea when text is typed
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [input]);

  // Scroll to bottom on new message or loading status change
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Animate the slow breathing sine wave
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!svg || !path) return;

    let width = svg.clientWidth || window.innerWidth;
    const height = 40;
    const amplitude = 5;
    const frequency = 0.006;
    const yOffset = height / 2;

    const handleResize = () => {
      if (svg) {
        width = svg.clientWidth || window.innerWidth;
      }
    };
    window.addEventListener("resize", handleResize);

    const drawWave = (phase: number) => {
      let d = `M 0 ${yOffset + Math.sin(phase) * amplitude}`;
      for (let x = 1; x <= width; x += 10) {
        const y = yOffset + Math.sin(x * frequency + phase) * amplitude;
        d += ` L ${x} ${y}`;
      }
      path.setAttribute("d", d);
    };

    if (prefersReducedMotion) {
      drawWave(0);
      window.removeEventListener("resize", handleResize);
      return;
    }

    let phase = 0;
    let frameId: number;

    const update = () => {
      phase += 0.012; // Slow sine breathing loop: 4s approx full period cycle
      drawWave(phase);
      frameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    // Reset input if sent directly
    if (!messageText) {
      setInput("");
    }
    
    setIsLoading(true);

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let updatedHistory = conversationHistory;

    // Optimistic UI updates
    if (!messageText) {
      setMessages((prev) => [...prev, { role: "user", content: textToSend, timestamp }]);
      updatedHistory = [...conversationHistory, { role: "user", content: textToSend }];
      setConversationHistory(updatedHistory);
    }

    // Clean up previous error message from screen on resend
    setMessages((prev) => prev.filter((m) => m.role !== "error"));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/ai-reports/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedHistory,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed response");
      }

      const data = await res.json();
      if (!data || !data.reply) {
        throw new Error("Invalid response format");
      }

      const aiReply = data.reply;
      const aiTimestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setMessages((prev) => [...prev, { role: "assistant", content: aiReply, timestamp: aiTimestamp }]);
      setConversationHistory((prev) => [...prev, { role: "assistant", content: aiReply }]);
      setCreditsRemaining((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("TradeSpace chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "error", content: "Abhi connect nahi ho pa raha. Thodi der mein try karo." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetry = () => {
    const lastUserMsg = conversationHistory.filter((m) => m.role === "user").pop();
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#0D1117] text-[#E6EDF3] overflow-hidden">
      {/* JetBrains Mono font injection */}
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      
      {/* Local custom animations */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          background-color: #00C9A7;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-dot 600ms ease-in-out infinite;
        }
        .typing-dot:nth-child(1) { animation-delay: 0ms; }
        .typing-dot:nth-child(2) { animation-delay: 150ms; }
        .typing-dot:nth-child(3) { animation-delay: 300ms; }

        @keyframes pulse-status-dot {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 1; }
        }
        .status-dot-pulse {
          animation: pulse-status-dot 2s ease-in-out infinite alternate;
        }

        @keyframes message-fade-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .message-appear {
          animation: message-fade-in 200ms ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .typing-dot { animation: none !important; }
          .status-dot-pulse { animation: none !important; }
          .message-appear { animation: none !important; opacity: 1 !important; transform: none !important; }
        }

        /* Calming Scrollbar */
        .calm-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .calm-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .calm-scroll::-webkit-scrollbar-thumb {
          background: #30363D;
          border-radius: 3px;
        }
        .calm-scroll::-webkit-scrollbar-thumb:hover {
          background: #8B949E/30;
        }
      `}</style>

      {/* 1. HEADER (60px) */}
      <header className="relative z-10 flex h-[60px] w-full items-center justify-between border-b border-[#30363D] px-6 select-none bg-[#0D1117]">
        {/* Animated breathing sine wave background */}
        <svg ref={svgRef} className="absolute inset-0 pointer-events-none w-full h-[40px] mt-[10px]" style={{ zIndex: -1 }}>
          <path ref={pathRef} fill="none" stroke="#00C9A7" strokeWidth="1.5" opacity="0.25" />
        </svg>

        {/* Left branding */}
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#00C9A7] status-dot-pulse flex-shrink-0" />
          <span className="text-base font-semibold tracking-tight text-[#E6EDF3]">TradeSpace</span>
        </div>

        {/* Center status */}
        <div className="hidden sm:block text-xs font-medium text-[#8B949E]">
          Your space. Private & safe.
        </div>

        {/* Right action */}
        <div>
          <button className="rounded-full border border-[#00C9A7]/40 bg-transparent px-3 py-1 text-[11px] font-semibold text-[#00C9A7] transition-all hover:bg-[#00C9A7]/10 active:scale-95 duration-100">
            Free community session — Thu 7pm
          </button>
        </div>
      </header>

      {/* 2. CHAT AREA (Scrollable, bottom-up display) */}
      <div 
        ref={chatContainerRef} 
        className="calm-scroll flex-1 overflow-y-auto px-6 py-6 flex flex-col"
      >
        <div className="flex-1 flex flex-col justify-end min-h-full">
          {messages.length === 0 ? (
            /* Empty state */
            <div className="my-auto flex flex-col items-center justify-center text-center p-6 max-w-sm mx-auto message-appear">
              <svg className="w-10 h-10 text-[#00C9A7] mb-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12.5h2.5L8 7l4 9 3.5-6.5L18.5 13H21" />
                <circle cx="8" cy="7" r="1.5" fill="#00C9A7" />
                <circle cx="12" cy="16" r="1.5" fill="#00C9A7" />
                <circle cx="15.5" cy="9.5" r="1.5" fill="#00C9A7" />
              </svg>
              <p className="text-[#E6EDF3] text-base font-medium mb-1">Aaj ka din kaisa raha?</p>
              <p className="text-[#8B949E] text-xs">Bolo, koi judge nahi karega.</p>
            </div>
          ) : (
            /* Message loop */
            <div className="w-full max-w-4xl mx-auto flex flex-col">
              {messages.map((msg, idx) => {
                if (msg.role === "user") {
                  return (
                    <div key={idx} className="flex justify-end mb-4 message-appear">
                      <div className="max-w-[80%] flex flex-col items-end gap-1.5">
                        <div className="bg-[#00C9A7] text-[#0D1117] text-sm px-4 py-3 rounded-2xl rounded-tr-none shadow-md font-medium whitespace-pre-wrap select-text leading-relaxed">
                          {msg.content}
                        </div>
                        {msg.timestamp && (
                          <span className="text-[10px] text-[#8B949E] px-1 font-mono tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {msg.timestamp}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                } else if (msg.role === "assistant") {
                  return (
                    <div key={idx} className="flex justify-start items-start gap-3 mb-4 message-appear">
                      <div className="w-8 h-8 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/20 flex items-center justify-center text-[#00C9A7] text-[11px] font-bold font-mono flex-shrink-0 mt-1 select-none">
                        TG
                      </div>
                      <div className="max-w-[80%] flex flex-col items-start gap-1.5">
                        <div className="bg-[#161B22] border-l-2 border-[#00C9A7] text-[#E6EDF3] text-sm px-4 py-3 rounded-2xl rounded-tl-none whitespace-pre-wrap select-text leading-relaxed">
                          {msg.content}
                        </div>
                        {msg.timestamp && (
                          <span className="text-[10px] text-[#8B949E] px-1 font-mono tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {msg.timestamp}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  /* Error handling message card */
                  return (
                    <div key={idx} className="flex flex-col items-start gap-2 max-w-md mb-4 message-appear">
                      <div className="text-[#FF6B6B] text-xs font-semibold bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 px-4 py-3.5 rounded-xl">
                        {msg.content}
                      </div>
                      <button
                        onClick={handleRetry}
                        className="text-xs text-[#00C9A7] hover:underline flex items-center gap-1 font-semibold ml-1 transition-all"
                      >
                        Retry
                      </button>
                    </div>
                  );
                }
              })}
            </div>
          )}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="w-full max-w-4xl mx-auto flex justify-start items-start gap-3 mb-4 message-appear">
              <div className="w-8 h-8 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/20 flex items-center justify-center text-[#00C9A7] text-[11px] font-bold font-mono flex-shrink-0 mt-1 select-none">
                TG
              </div>
              <div className="bg-[#161B22] border-l-2 border-[#00C9A7] px-4 py-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. INPUT AREA (Fixed bottom, 80px max bounds) */}
      <footer className="border-t border-[#30363D] bg-[#0D1117] p-4 flex flex-col items-center relative z-10 select-none">
        <div className="w-full max-w-4xl flex flex-col">
          {/* Header row for credits / state message */}
          <div className="flex items-center justify-between px-1 mb-1.5">
            {creditsRemaining > 0 ? (
              <span 
                className={`text-[11px] transition-colors duration-200`}
                style={{ 
                  fontFamily: "'JetBrains Mono', monospace",
                  color: creditsRemaining === 1 ? "#F0A500" : "#8B949E"
                }}
              >
                {creditsRemaining} {creditsRemaining === 1 ? "session" : "sessions"} left
              </span>
            ) : (
              <span className="text-[11px] text-[#8B949E]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Get more sessions to continue
              </span>
            )}
          </div>

          {/* Upsell Card (Appears above input when credits run out) */}
          {creditsRemaining === 0 && (
            <a 
              href="#" 
              className="mb-3 flex items-center justify-between border border-[#00C9A7]/50 bg-[#161B22] px-4 py-3 rounded-xl hover:border-[#00C9A7] transition-all duration-200 group"
            >
              <span className="text-xs text-[#E6EDF3] font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7] animate-pulse" />
                Get 20 sessions for ₹29
              </span>
              <span className="text-xs text-[#00C9A7] font-semibold group-hover:translate-x-0.5 transition-transform" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                →
              </span>
            </a>
          )}

          {/* Interactive chat row */}
          <div className="relative flex items-end border border-[#30363D] focus-within:border-[#00C9A7] bg-[#161B22] rounded-xl overflow-hidden transition-colors duration-200">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyDown}
              placeholder={creditsRemaining > 0 ? "Kuch bhi likho — trade, loss, frustration..." : "Get more sessions to continue"}
              disabled={creditsRemaining === 0 || isLoading}
              rows={1}
              className="w-full bg-transparent text-sm text-[#E6EDF3] placeholder-[#8B949E]/60 pl-4 pr-16 py-3.5 focus:outline-none resize-none max-h-32 min-h-[48px] leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                scrollbarWidth: "none",
              }}
            />
            
            {/* Character counter (shows while typing) */}
            {input.length > 0 && (
              <span 
                className="absolute top-2.5 right-14 text-[9px] text-[#8B949E] px-1.5 py-0.5 rounded bg-[#0D1117] border border-[#30363D]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {input.length}/500
              </span>
            )}

            {/* Submit button */}
            <div className="absolute right-3 bottom-2.5">
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || creditsRemaining === 0 || isLoading}
                className="w-8 h-8 rounded-full bg-[#00C9A7] text-[#0D1117] flex items-center justify-center disabled:bg-[#30363D] disabled:text-[#8B949E] hover:bg-[#00b092] active:scale-95 transition-all duration-100"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Footer private warning */}
          <span className="text-[10px] text-[#8B949E]/70 text-center mt-2.5 tracking-tight font-light select-none">
            Your conversations are private and never shared.
          </span>
        </div>
      </footer>
    </div>
  );
}
