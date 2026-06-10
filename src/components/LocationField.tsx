"use client";

import { useState } from "react";

export type LocationStatus = "requesting" | "granted" | "denied" | "manual";

interface Props {
  status: LocationStatus;
  /** Human label for the current location ("Your location", geocoded name…). */
  label: string | null;
  busy: boolean;
  onUseMyLocation: () => void;
  onSubmitQuery: (query: string) => void;
}

export function LocationField({ status, label, busy, onUseMyLocation, onSubmitQuery }: Props) {
  const [query, setQuery] = useState("");

  if (status === "requesting") {
    return (
      <p className="flex min-h-11 items-center gap-2 text-sm text-muted" role="status">
        <span aria-hidden>📍</span> Finding where you are…
      </p>
    );
  }

  if (status === "granted" || (status === "manual" && label)) {
    return (
      <p className="flex min-h-11 items-center justify-between gap-2 text-sm">
        <span className="truncate">
          <span aria-hidden>📍 </span>
          {label ?? "Your location"}
        </span>
        {status === "granted" ? null : (
          <button
            type="button"
            onClick={onUseMyLocation}
            className="shrink-0 font-medium text-primary underline-offset-2 hover:underline"
          >
            Use my location
          </button>
        )}
      </p>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (query.trim().length >= 2) onSubmitQuery(query.trim());
      }}
      className="space-y-2"
    >
      <label htmlFor="location-query" className="block text-sm font-semibold">
        Where are you?
      </label>
      <div className="flex gap-2">
        <input
          id="location-query"
          name="location-query"
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder="Neighborhood, landmark, or address"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy || query.trim().length < 2}
          className="min-h-11 shrink-0 rounded-xl border border-line bg-card px-4 text-sm font-semibold text-ink transition-colors hover:border-primary disabled:opacity-50"
        >
          {busy ? "…" : "Set"}
        </button>
      </div>
      <button
        type="button"
        onClick={onUseMyLocation}
        className="min-h-11 text-sm font-medium text-primary underline-offset-2 hover:underline"
      >
        Try my location again
      </button>
    </form>
  );
}
