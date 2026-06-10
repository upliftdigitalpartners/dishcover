"use client";

import { DISCOVERY } from "@/lib/config";

const OPTIONS = [
  { meters: DISCOVERY.defaultRadiusMeters, label: "10-min walk" },
  { meters: DISCOVERY.widenedRadiusMeters, label: "25-min walk" },
];

interface Props {
  value: number;
  onChange: (radiusMeters: number) => void;
}

export function DistancePicker({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">How far will you walk?</legend>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Walking distance">
        {OPTIONS.map(({ meters, label }) => {
          const selected = value === meters;
          return (
            <button
              key={meters}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(meters)}
              className={`press min-h-11 rounded-xl border text-sm font-semibold ${
                selected
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-line bg-card text-ink hover:border-primary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
