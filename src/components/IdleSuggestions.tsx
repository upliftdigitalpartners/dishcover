"use client";

import type { Budget, Mood } from "@/lib/types";

export interface Preset {
  label: string;
  emoji: string;
  mood: Mood;
  budget: Budget;
}

const PRESETS: Preset[] = [
  { label: "Late-night bite · $", emoji: "🌙", mood: "late-night", budget: 1 },
  { label: "Local gem · $$", emoji: "🥘", mood: "local-authentic", budget: 2 },
  { label: "Date night · $$$", emoji: "✨", mood: "treat-yourself", budget: 3 },
];

interface Props {
  /** Fired with the preset; the parent fills the form and (if located) searches. */
  onPick: (preset: Preset) => void;
}

/** Fills the dead space before the first search with one-tap starting points. */
export function IdleSuggestions({ onPick }: Props) {
  return (
    <div className="animate-pop-in rounded-2xl border border-dashed border-line bg-card/60 p-4 text-center">
      <p className="text-sm font-semibold">No idea what you want?</p>
      <p className="mt-0.5 text-xs text-muted">One tap and we&apos;ll take it from there.</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.mood}
            type="button"
            onClick={() => onPick(preset)}
            className="press flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-card px-4 text-sm font-medium hover:border-primary"
          >
            <span aria-hidden>{preset.emoji}</span>
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
