"use client";

import { useState } from "react";
import { DietaryBadges } from "@/components/DietaryBadges";
import type { ResultCardData } from "@/lib/types";

function formatPrice(price: number): string {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

/** "Closes in ~40 min" inside 75 min, "Until 10:30 PM" otherwise. */
function closeInfo(closesAt: string | null): { soon: boolean; label: string } | null {
  if (!closesAt) return null;
  const minutes = Math.round((Date.parse(closesAt) - Date.now()) / 60_000);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  if (minutes <= 75) {
    return { soon: true, label: `Closes in ~${Math.max(5, Math.round(minutes / 5) * 5)} min` };
  }
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(closesAt));
  return { soon: false, label: `Until ${time}` };
}

interface Props {
  card: ResultCardData;
  highlight?: boolean;
  /** Stagger index for the entrance animation. */
  index?: number;
}

export function ResultCard({ card, highlight = false, index = 0 }: Props) {
  const topDish = card.dishes[0];
  const closing = closeInfo(card.closesAt);

  // Cards mount client-side only (post-search), so feature detection in the
  // initializer is hydration-safe.
  const [canShare] = useState(() => typeof navigator !== "undefined" && "share" in navigator);

  const share = () => {
    const dishBit = topDish ? ` — order the ${topDish.name}` : "";
    navigator
      .share({
        title: card.name,
        text: `${card.name}${dishBit} · ${card.walkMinutes} min walk`,
        url: card.directionsUrl,
      })
      .catch(() => {}); // user dismissed the sheet — not an error
  };

  return (
    <article
      style={{ "--i": index } as React.CSSProperties}
      className={`stagger ${
        // Later cards start below the fold — let scroll progress drive their
        // entrance where animation-timeline is supported (.view-rise wins).
        index >= 3 ? "view-rise " : ""
      }rounded-2xl border bg-card p-4 shadow-card ${
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
        {closing && !closing.soon && (
          <>
            <span aria-hidden>·</span>
            <span>{closing.label}</span>
          </>
        )}
      </p>

      {closing?.soon && (
        <p
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-deep"
          role="status"
        >
          <span aria-hidden>⏰</span> {closing.label}
        </p>
      )}

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

      <div className="mt-3 flex gap-2">
        <a
          href={card.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="press flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-deep"
        >
          <span aria-hidden>🧭</span> Directions
        </a>
        {canShare && (
          <button
            type="button"
            onClick={share}
            className="press flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-card px-4 text-sm font-semibold hover:border-primary"
          >
            <span aria-hidden>📤</span> Share
          </button>
        )}
      </div>
    </article>
  );
}
