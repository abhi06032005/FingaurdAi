"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  MessageSquare, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  User, 
  ShieldAlert, 
  AlertTriangle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Flag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export default function ScamDiscussionsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Admin authentication check
  const [isAdmin, setIsAdmin] = useState(false);

  const { user, isLoaded } = useUser();

  useEffect(() => {
    const token = localStorage.getItem("finguard_admin_token");
    if (token === "finguard_admin_authenticated") {
      setIsAdmin(true);
    }
    fetchComments();
  }, []);

  // Load unique random username when auth is ready
  useEffect(() => {
    if (isLoaded) {
      const name = getOrSetUsername(user?.id);
      setAuthor(name);
    }
  }, [user, isLoaded]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Artificial delay of 1.5 seconds to simulate slow Instagram comments loading
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const res = await fetch(`${API_BASE}/scam-platform/comments`);
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.data || []);
      } else {
        setError(data.error || "Failed to load discussions.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to discussion server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (text.length > 100) return;

    try {
      setSubmitting(true);
      setSubmitError(null);
      const res = await fetch(`${API_BASE}/scam-platform/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, author: author.trim() || "Anonymous" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess(true);
        setText("");
        
        // Fetch comments again to show the updated list
        fetchComments();
        
        setTimeout(() => setSubmitSuccess(false), 3000);
      } else {
        setSubmitError(data.error || "Failed to submit comment.");
      }
    } catch (err) {
      setSubmitError("Failed to reach server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`${API_BASE}/scam-platform/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": localStorage.getItem("finguard_admin_token") || "",
        },
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert("Failed to delete comment. Unauthorized access.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server.");
    }
  };

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
      console.error(err);
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
      console.error(err);
    }
  };

  const handleReportComment = async (commentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/scam-platform/comments/${commentId}/report`, {
        method: "POST"
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, reported: true } : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-[#050506] min-h-screen text-foreground pb-20 relative overflow-hidden select-none">
      
      {/* Background shadow glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[450px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-150px] left-[30%] w-[40%] h-[300px] bg-violet-600/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-16 relative z-10 space-y-8">
        
        <header className="space-y-4 text-left">
          <Link href="/scams" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Scam Hub
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <MessageSquare className="h-8 w-8 text-violet-500 animate-pulse" />
              Live Scam Awareness Discussions
            </h1>
            <p className="text-sm text-gray-400">
              Ask questions, discuss suspicious advisory services, and warn others in real-time.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Comments List (Instagram comments loading) */}
          <div className="md:col-span-2 space-y-6">
            
            <Card className="border-white/5 bg-slate-950/20 backdrop-blur-md p-6 text-left">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <span className="text-xs font-bold text-slate-400">Discussion Feed</span>
                <Button 
                  onClick={fetchComments} 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] text-violet-400 hover:text-white cursor-pointer"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
                  Refresh Live Feed
                </Button>
              </div>

              {loading ? (
                /* Shimmering Instagram comment Skeletons */
                <div className="space-y-5 py-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-3 items-start animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-white/5 flex-shrink-0"></div>
                      <div className="space-y-2 flex-1 pt-1.5">
                        <div className="h-3 bg-white/10 rounded w-24"></div>
                        <div className="h-3 bg-white/5 rounded w-full"></div>
                        <div className="h-2 bg-white/5 rounded w-16 pt-0.5"></div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-center pt-4 text-[10px] text-gray-500 italic">
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 text-violet-400" />
                    Fetching live comments (Instagram style loading)...
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-xs text-red-500 font-semibold">
                  {error}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-20 text-xs text-gray-500 italic">
                  No comments yet. Be the first to start the discussion!
                </div>
              ) : (
                <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 items-start border-b border-white/5 pb-4 last:border-b-0 group">
                      
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {comment.author[0]}
                      </div>

                      {/* Comment text */}
                      <div className="flex-1 space-y-1.5 pt-0.5 text-xs text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{comment.author}</span>
                          <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-300 leading-relaxed font-medium">
                          {comment.text}
                        </p>
                        
                        {/* Interactions (Upvote, Downvote, Report) */}
                        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold pt-1 select-none">
                          <button
                            onClick={() => handleUpvote(comment.id)}
                            className="flex items-center gap-1 hover:text-green-400 transition-colors cursor-pointer"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{comment.upvotes}</span>
                          </button>
                          <button
                            onClick={() => handleDownvote(comment.id)}
                            className="flex items-center gap-1 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <ThumbsDown className="w-3 h-3" />
                            <span>{comment.downvotes}</span>
                          </button>
                          <button
                            onClick={() => !comment.reported && handleReportComment(comment.id)}
                            disabled={comment.reported}
                            className={`flex items-center gap-1 transition-colors ${
                              comment.reported 
                                ? "text-amber-500 cursor-not-allowed" 
                                : "hover:text-amber-500 cursor-pointer"
                            }`}
                          >
                            <Flag className="w-3 h-3" />
                            <span>{comment.reported ? "Reported" : "Report"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Admin Delete Action */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-slate-500 transition-all p-1 cursor-pointer flex-shrink-0"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>

          {/* Right Column: Submit Comment Form */}
          <div className="md:col-span-1 space-y-6">
            
            <Card className="border-white/10 bg-slate-950/30 backdrop-blur-md p-6 text-left">
              <h3 className="font-bold text-sm text-white border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-violet-400" />
                Submit Comment
              </h3>

              <form onSubmit={handleAddComment} className="space-y-4 text-xs">
                
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Username</label>
                  <Input
                    value={author || "Assigning Name..."}
                    disabled
                    className="bg-[#0c0d12]/60 border-white/5 text-violet-400 font-bold rounded-xl text-xs sm:text-sm h-11 cursor-not-allowed select-none"
                  />
                </div>

                {/* Comment Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Your message</label>
                  <textarea
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={100}
                    placeholder="Discuss NSE advisors, warn others, or report pump groups..."
                    className="w-full resize-none border-white/10 bg-[#0c0d12] focus:border-violet-500 text-xs p-3 rounded-xl leading-relaxed text-slate-200"
                    required
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                    <span>Max 100 characters</span>
                    <span>{text.length} / 100</span>
                  </div>
                </div>

                {submitError && (
                  <p className="text-[10px] text-red-500 font-semibold">{submitError}</p>
                )}

                {submitSuccess && (
                  <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Comment published live!
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting || !text.trim() || submitSuccess || !author}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-10 rounded-xl cursor-pointer text-xs"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  Publish Comment
                </Button>
              </form>
            </Card>

            {/* Moderation Advisory */}
            <div className="border border-white/5 bg-white/5 p-4 rounded-2xl space-y-2 text-left text-slate-400 leading-normal">
              <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Moderation Policy
              </h4>
              <p className="text-[10px] font-medium leading-relaxed">
                Discussions are moderated by the FinGuard analyst team. Spam, phishing links, or promotion of unverified premium groups will be deleted immediately.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
