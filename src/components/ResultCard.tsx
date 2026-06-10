"use client";

import type { ResultCardData } from "@/lib/types";

function formatPrice(price: number): string {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

interface Props {
  card: ResultCardData;
  highlight?: boolean;
}

export function ResultCard({ card, highlight = false }: Props) {
  const topDish = card.dishes[0];

  return (
    <article
      className={`rounded-2xl border bg-card p-4 shadow-sm ${
        highlight ? "border-primary" : "border-line"
      }`}
    >
      <h3 className="text-lg font-bold leading-snug">{card.name}</h3>

      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
        {card.rating !== null && (
          <span>
            <span aria-hidden>★ </span>
            <span className="font-medium text-ink">{card.rating.toFixed(1)}</span>
            {card.userRatingCount !== null && <> ({card.userRatingCount.toLocaleString()})</>}
          </span>
        )}
        {card.priceLevel !== null && (
          <span aria-label={`Price level ${card.priceLevel} of 4`}>
            {"$".repeat(card.priceLevel)}
          </span>
        )}
        <span>{card.walkMinutes} min walk</span>
      </p>

      {card.dishes.length > 0 && (
        <div className="mt-3 rounded-xl bg-primary-soft/60 px-3 py-2">
          <p className="text-sm">
            <span className="font-semibold text-primary-deep">Order this: </span>
            {card.dishes.map((dish, i) => (
              <span key={dish.name}>
                {i > 0 && <span aria-hidden> · </span>}
                <span className="font-medium">{dish.name}</span>
                {dish.price !== null && <> (${formatPrice(dish.price)})</>}
              </span>
            ))}
          </p>
          {topDish && topDish.mentions >= 3 && (
            <p className="mt-0.5 text-xs text-muted">
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
        className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-deep"
      >
        Directions
      </a>
    </article>
  );
}
