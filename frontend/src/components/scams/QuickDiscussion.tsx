"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ArrowRight, Loader2, CheckCircle2, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/nextjs";
import { getOrSetUsername } from "@/lib/username";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Comment {
  id: string;
  text: string;
  author: string;
  reported: boolean;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

export function QuickDiscussion() {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comments List State
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Load or generate unique random username on mount/auth load
  useEffect(() => {
    if (isLoaded) {
      const name = getOrSetUsername(user?.id);
      setAuthor(name);
    }
  }, [user, isLoaded]);

  // Fetch recent comments on mount
  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await fetch(`${API_BASE}/scam-platform/comments`);
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.data.slice(0, 3) || []); // Limit to latest 3 comments
      }
    } catch (err) {
      console.error("[QuickDiscussion] Failed to fetch comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleUpvote = async (commentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/scam-platform/comments/${commentId}/upvote`, {
        method: "POST"
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, upvotes: c.upvotes + 1 } : c))
        );
      }
    } catch (err) {
      console.error("[QuickDiscussion] Failed to upvote:", err);
    }
  };

  const handleDownvote = async (commentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/scam-platform/comments/${commentId}/downvote`, {
        method: "POST"
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, downvotes: c.downvotes + 1 } : c))
        );
      }
    } catch (err) {
      console.error("[QuickDiscussion] Failed to downvote:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (text.length > 100) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/scam-platform/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, author: author.trim() || "Anonymous" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setText("");
        fetchComments(); // Refresh list immediately
        setTimeout(() => {
          setSuccess(false);
          router.push("/scams/discussions");
        }, 1200);
      } else {
        setError(data.error || "Failed to submit comment.");
      }
    } catch (err) {
      setError("Failed to reach discussion server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto border border-white/5 bg-slate-950/45 backdrop-blur-md p-6 rounded-2xl text-left space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5 text-violet-400" />
          Scam Prevention Live Discussion
        </h3>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
          100 Char Limit
        </span>
      </div>

      {/* Recent comments list */}
      <div className="space-y-3 border-t border-b border-white/5 py-4 my-2">
        <h4 className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">Recent Discussion Feed</h4>
        {loadingComments ? (
          <div className="space-y-3 py-1">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-2.5 items-start animate-pulse">
                <div className="w-7 h-7 rounded-full bg-white/5 flex-shrink-0"></div>
                <div className="space-y-1.5 flex-1 pt-1">
                  <div className="h-2.5 bg-white/10 rounded w-20"></div>
                  <div className="h-2 bg-white/5 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-2">No comments yet. Start the discussion below!</p>
        ) : (
          <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5 items-start border-b border-white/5 pb-2.5 last:border-b-0 last:pb-0 text-xs">
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-[10px] uppercase flex-shrink-0">
                  {comment.author[0]}
                </div>
                
                {/* Text and stats */}
                <div className="flex-1 space-y-1 text-[11px] text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-200">{comment.author}</span>
                    <span className="text-[9px] text-gray-500 font-semibold">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-300 font-medium leading-normal">{comment.text}</p>
                  
                  {/* Upvote & Downvote buttons */}
                  <div className="flex items-center gap-3 text-[9px] text-slate-500 font-bold pt-0.5 select-none">
                    <button
                      type="button"
                      onClick={() => handleUpvote(comment.id)}
                      className="flex items-center gap-0.5 hover:text-green-400 transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-2.5 h-2.5" />
                      <span>{comment.upvotes}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownvote(comment.id)}
                      className="flex items-center gap-0.5 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <ThumbsDown className="w-2.5 h-2.5" />
                      <span>{comment.downvotes}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={100}
            placeholder="Discuss scams, ask questions, warn others..."
            className="flex-1 bg-[#0b101c]/40 border-white/10 text-white placeholder-slate-600 rounded-xl text-xs sm:text-sm h-11"
            required
          />
          <Input
            value={author || "Assigning Name..."}
            disabled
            className="w-full sm:w-48 bg-[#0b101c]/20 border-white/5 text-violet-400 font-bold rounded-xl text-xs sm:text-sm h-11 cursor-not-allowed select-none"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold">
          <span>{text.length} / 100 characters</span>
          <button
            type="button"
            onClick={() => router.push("/scams/discussions")}
            className="text-violet-400 hover:text-white transition-colors cursor-pointer flex items-center gap-0.5"
          >
            View Discussions <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {error && (
          <p className="text-[10px] text-red-500 font-semibold">{error}</p>
        )}

        {success && (
          <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" /> Comment added! Redirecting...
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !text.trim() || success || !author}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-10 rounded-xl cursor-pointer text-xs flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting Comment...
            </>
          ) : (
            <>
              Submit Live Comment <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
