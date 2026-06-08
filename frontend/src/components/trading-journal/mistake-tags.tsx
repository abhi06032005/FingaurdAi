"use client";

import { Badge } from "@/components/ui/badge";

const ALL_MISTAKES = [
  "Entered Late",
  "Exited Early",
  "Moved Stop Loss",
  "No Stop Loss",
  "Overtrading",
  "FOMO Entry",
  "Revenge Trading",
  "Oversized Position",
  "Averaged Down",
  "Ignored Plan",
];

interface MistakeTagsProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function MistakeTags({ value, onChange }: MistakeTagsProps) {
  const toggleMistake = (mistake: string) => {
    if (value.includes(mistake)) {
      onChange(value.filter((m) => m !== mistake));
    } else {
      onChange([...value, mistake]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_MISTAKES.map((mistake) => {
        const isSelected = value.includes(mistake);
        return (
          <Badge
            key={mistake}
            variant={isSelected ? "default" : "outline"}
            className="cursor-pointer transition-all hover:opacity-80 px-3 py-1.5"
            onClick={() => toggleMistake(mistake)}
          >
            {mistake}
          </Badge>
        );
      })}
    </div>
  );
}
