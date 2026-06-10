"use client";

import { DISCOVERY, MOOD_KEYS } from "@/lib/config";
import type { Mood } from "@/lib/types";

interface Props {
  value: Mood | null;
  onChange: (mood: Mood) => void;
}

export function MoodChips({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">What are you in the mood for?</legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Mood">
        {MOOD_KEYS.map((mood) => {
          const selected = value === mood;
          return (
            <button
              key={mood}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(mood)}
              className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
                selected
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-card text-ink hover:border-primary"
              }`}
            >
              {DISCOVERY.moods[mood].label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
