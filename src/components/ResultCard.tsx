"use client";

import { DietaryBadges } from "@/components/DietaryBadges";
import type { ResultCardData } from "@/lib/types";

function formatPrice(price: number): string {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

interface Props {
  card: ResultCardData;
  highlight?: boolean;
  /** Stagger index for the entrance animation. */
  index?: number;
}

export function ResultCard({ card, highlight = false, index = 0 }: Props) {
  const topDish = card.dishes[0];

  return (
    <article
      style={{ "--i": index } as React.CSSProperties}
      className={`stagger rounded-2xl border bg-card p-4 shadow-card ${
        highlight ? "border-primary ring-1 ring-primary/30" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-snug">{card.name}</h3>
        {card.rating !== null && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-sm font-bold text-primary-deep">
            <span aria-hidden>★</span>
            {card.rating.toFixed(1)}
          </span>
        )}
      </div>

      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted">
        {card.userRatingCount !== null && <span>{card.userRatingCount.toLocaleString()} ratings</span>}
        {card.priceLevel !== null && (
          <>
            <span aria-hidden>·</span>
            <span aria-label={`Price level ${card.priceLevel} of 4`}>
              {"$".repeat(card.priceLevel)}
            </span>
          </>
        )}
        <span aria-hidden>·</span>
        <span className="font-medium text-ink">{card.walkMinutes} min walk</span>
      </p>

      <DietaryBadges dietary={card.dietary} />

      {card.dishes.length > 0 && (
        <div className="mt-3 rounded-xl bg-primary-soft/50 p-3">
          <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-primary-deep">
            <span aria-hidden>🍽️</span> Order this
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {card.dishes.map((dish) => (
              <li
                key={dish.name}
                className="rounded-full bg-card px-2.5 py-1 text-sm font-medium shadow-sm"
              >
                {dish.name}
                {dish.price !== null && (
                  <span className="text-muted"> · ${formatPrice(dish.price)}</span>
                )}
              </li>
            ))}
          </ul>
          {topDish && topDish.mentions >= 3 && (
            <p className="mt-2 text-xs text-muted">
              “{topDish.name}” comes up in {topDish.mentions} reviews
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-sm text-muted">{card.whyLine}</p>

      <a
        href={card.directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="press mt-3 flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-deep"
      >
        <span aria-hidden>🧭</span> Directions
      </a>
    </article>
  );
}
