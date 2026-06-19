'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Search, Sparkles, Loader2, X } from 'lucide-react';

interface ScreenerSearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export function ScreenerSearchBar({ onSearch, isLoading, initialValue = '' }: ScreenerSearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSearch = () => {
    if (!value.trim() || isLoading) return;
    onSearch(value.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') {
      setValue('');
      inputRef.current?.blur();
    }
  };

  const clear = () => {
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      {/* Outer glow ring */}
      <div
        className={`absolute -inset-0.5 rounded-2xl transition-all duration-500 ${
          isFocused
            ? 'bg-gradient-to-r from-primary via-accent to-primary opacity-60 blur-sm'
            : 'opacity-0'
        }`}
        aria-hidden
      />

      {/* Search bar container */}
      <div
        className={`relative flex items-center gap-3 rounded-2xl border px-5 py-4 transition-all duration-300 ${
          isFocused
            ? 'border-primary/60 bg-card shadow-2xl shadow-primary/10'
            : 'border-border bg-card/80 shadow-lg'
        }`}
      >
        {/* Left icon */}
        <div
          className={`shrink-0 transition-all duration-300 ${
            isFocused ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {isLoading ? (
            <Loader2 size={22} className="animate-spin text-primary" />
          ) : (
            <div className="relative">
              <Search size={22} />
              {isFocused && (
                <Sparkles
                  size={10}
                  className="absolute -top-1 -right-1 text-primary animate-pulse"
                />
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          id="screener-search-input"
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask anything… e.g. 'Large cap IT stocks with RSI below 40'"
          disabled={isLoading}
          className="flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
          aria-label="Stock screener natural language search"
          autoComplete="off"
        />

        {/* Clear button */}
        {value && !isLoading && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}

        {/* AI badge */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Sparkles size={11} />
          AI
        </div>

        {/* Search button */}
        <button
          type="button"
          id="screener-search-btn"
          onClick={handleSearch}
          disabled={!value.trim() || isLoading}
          className="shrink-0 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:brightness-110 hover:shadow-primary/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Run screener query"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span className="hidden sm:inline">Scanning…</span>
            </>
          ) : (
            <>
              <Search size={14} />
              <span className="hidden sm:inline">Screen</span>
            </>
          )}
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="absolute -bottom-6 right-1 text-[11px] text-muted-foreground/50 select-none">
        <kbd className="rounded border border-border/50 px-1 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
        {' '}to focus
      </div>
    </div>
  );
}
