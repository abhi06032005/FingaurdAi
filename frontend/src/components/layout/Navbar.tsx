"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Show, UserButton, useUser } from '@clerk/nextjs';
import { ThemeToggle } from "@/components/theme-toggle";
import { ShieldCheck, Menu, X, Sparkles } from "lucide-react";

import { useUserDb } from "@/context/UserContext";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/stocks", label: "Stock Analyzer" },
  { href: "/analysis", label: "Technical Analysis" },
  { href: "/trading-journal", label: "Trading Journal" },
  { href: "/learn", label: "Learn" },
  { href: "/events", label: "Events" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isLoaded, isSignedIn } = useUser();
  const { dbUser, updatePlan } = useUserDb();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const welcomed = localStorage.getItem("finguard_welcomed");
      if (!welcomed) {
        setShowWelcome(true);
      }
    }
  }, [isLoaded, isSignedIn]);

  const handleClaim = async () => {
    localStorage.setItem("finguard_welcomed", "true");
    setShowWelcome(false);
    if (dbUser && dbUser.plan !== 'FREE') {
      await updatePlan('FREE');
    }
    router.push("/stocks");
  };
  if (pathname === "/tradespace") return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setIsOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary shadow-inner">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-normal text-foreground">FinGuard AI</span>
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center xl:flex">
          <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-muted/45 p-1 shadow-inner backdrop-blur-md">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="ghost" className="hidden sm:inline-flex">
                Login
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button>Register</Button>
            </Link>
          </Show>

          {/* Mobile Hamburger toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="xl:hidden h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav items */}
      {isOpen && (
        <div className="absolute top-[4.5rem] left-0 w-full bg-background/95 backdrop-blur-xl border-b border-border/80 p-4 shadow-xl flex flex-col gap-1 xl:hidden z-40 animate-in fade-in slide-in-from-top-4 duration-200">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Welcome Trial Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Background Glow */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Sparkles className="w-7 h-7 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-foreground tracking-tight">Claim Your Free AI Report</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  Welcome to FinGuard AI! Start your journey by analyzing any Indian stock fundamental report for free. We've credited 1 free trial report to your account.
                </p>
              </div>

              <button
                onClick={handleClaim}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                Claim Free Report & Start Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
