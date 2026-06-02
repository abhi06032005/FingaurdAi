"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
    router.refresh();
    // Force direct reload to clear contexts
    window.location.href = "/";
  };

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
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="transition-colors hover:text-primary text-primary font-semibold">
              Admin Panel
            </Link>
          )}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Hello, <strong className="text-foreground">{user.name}</strong>
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:inline-flex">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
