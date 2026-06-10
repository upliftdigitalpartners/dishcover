"use client";

import { DIETARY, DIETARY_KEYS } from "@/lib/config";
import type { Dietary } from "@/lib/types";

interface Props {
  value: Dietary[];
  onChange: (next: Dietary[]) => void;
}

export function DietaryPicker({ value, onChange }: Props) {
  const toggle = (key: Dietary) => {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  };

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">
        Dietary needs{" "}
        <span className="font-normal text-muted">· optional</span>
      </legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Dietary needs">
        {DIETARY_KEYS.map((key) => {
          const selected = value.includes(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(key)}
              className={`press flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium ${
                selected
                  ? "border-accent bg-accent text-white shadow-sm"
                  : "border-line bg-card text-ink hover:border-accent"
              }`}
            >
              <span aria-hidden className="text-base leading-none">
                {DIETARY[key].emoji}
              </span>
              {DIETARY[key].label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
