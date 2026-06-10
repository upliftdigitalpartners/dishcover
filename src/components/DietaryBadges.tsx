import { DIETARY } from "@/lib/config";
import type { Dietary } from "@/lib/types";

export function DietaryBadges({ dietary }: { dietary: Dietary[] }) {
  if (dietary.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Dietary accommodations">
      {dietary.map((key) => (
        <li
          key={key}
          className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent"
        >
          <span aria-hidden>{DIETARY[key].emoji}</span>
          {DIETARY[key].label}
        </li>
      ))}
    </ul>
  );
}
