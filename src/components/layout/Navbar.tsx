"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Show, UserButton, useUser } from '@clerk/nextjs';
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "ADMIN";

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Logo */}
        <div className="mr-8 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-primary">FinGuard AI</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Home
          </Link>
          <Link href="/stocks" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Stock Analyzer
          </Link>
          <Link href="/scanner" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Scam Scanner
          </Link>
          <Link href="/learn" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Learn
          </Link>
          <Link href="/influencers" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Influencers
          </Link>
          <Link href="/events" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Events
          </Link>
          <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Dashboard
          </Link>
          {isAdmin && (
            <Link href="/admin" className="transition-colors hover:text-primary text-primary font-semibold">
              Admin Panel
            </Link>
          )}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
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
