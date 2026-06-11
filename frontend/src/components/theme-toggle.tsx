"use client";

import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const toggleTheme = () => {
    const root = document.documentElement;
    const nextIsDark = !root.classList.contains("dark");

    root.classList.toggle("dark", nextIsDark);
    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title="Toggle Theme"
      className="h-9 w-9 rounded-lg"
    >
      <Sun className="hidden h-5 w-5 text-amber-500 dark:block" />
      <Moon className="h-5 w-5 text-muted-foreground dark:hidden" />
    </Button>
  );
}
