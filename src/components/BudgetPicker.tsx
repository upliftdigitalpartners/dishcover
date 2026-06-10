"use client";

import type { Budget } from "@/lib/types";

const BUDGETS: Budget[] = [1, 2, 3, 4];

interface Props {
  value: Budget;
  onChange: (budget: Budget) => void;
}

export function BudgetPicker({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">Budget</legend>
      <div className="grid grid-cols-4 gap-2" role="group" aria-label="Budget">
        {BUDGETS.map((budget) => {
          const selected = value === budget;
          return (
            <button
              key={budget}
              type="button"
              aria-pressed={selected}
              aria-label={`Budget level ${budget} of 4`}
              onClick={() => onChange(budget)}
              className={`press min-h-11 rounded-xl border text-sm font-semibold ${
                selected
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-line bg-card text-ink hover:border-primary"
              }`}
            >
              {"$".repeat(budget)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
