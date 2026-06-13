"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextIsDark = !root.classList.contains("dark");

    root.classList.toggle("dark", nextIsDark);
    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title="Toggle Theme"
      className="h-9 w-9 rounded-lg transition-transform active:scale-95"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-500 animate-in spin-in-45 duration-200" />
      ) : (
        <Moon className="h-5 w-5 text-muted-foreground animate-in spin-in-45 duration-200" />
      )}
    </Button>
  );
}
