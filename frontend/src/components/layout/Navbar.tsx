"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Show, UserButton } from '@clerk/nextjs';
import { ThemeToggle } from "@/components/theme-toggle";
import { ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/stocks", label: "Stock Analyzer" },
  { href: "/scanner", label: "Scam Scanner" },
  { href: "/scams", label: "Scam Awareness" },
  { href: "/news", label: "News" },
  { href: "/trading-journal", label: "Trading Journal" },
  { href: "/learn", label: "Learn" },
  { href: "/influencers", label: "Influencers" },
  { href: "/events", label: "Events" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center">
          <Link href="/" className="flex items-center gap-2.5">
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
        </div>
      </div>
    </nav>
  );
}
