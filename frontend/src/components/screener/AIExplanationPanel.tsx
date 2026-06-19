'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIExplanationPanelProps {
  explanation: string;
  isLoading?: boolean;
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const prevText = useRef('');

  useEffect(() => {
    if (!text) { setDisplayed(''); return; }
    if (text === prevText.current) return;
    prevText.current = text;
    setDisplayed('');
    setDone(false);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 14);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary" />}
    </span>
  );
}

export function AIExplanationPanel({ explanation, isLoading = false }: AIExplanationPanelProps) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card/60 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Analysing results…</span>
        </div>
        <div className="mt-4 space-y-2">
          {[80, 65, 45].map(w => (
            <div key={w} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!explanation) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card/60 px-5 py-4 backdrop-blur-sm"
      role="region"
      aria-label="AI explanation"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 flex h-6 w-6 items-center justify-center rounded-md bg-primary/15">
          <Sparkles size={12} className="text-primary" />
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">
          <TypewriterText text={explanation} />
        </p>
      </div>
    </div>
  );
}
