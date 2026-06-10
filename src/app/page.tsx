"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BudgetPicker } from "@/components/BudgetPicker";
import { DistancePicker } from "@/components/DistancePicker";
import { LocationField, type LocationStatus } from "@/components/LocationField";
import { MoodChips } from "@/components/MoodChips";
import { ResultCard } from "@/components/ResultCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { DemoBanner, EmptyState, ErrorState, WidenedNotice } from "@/components/StatusStates";
import { DISCOVERY } from "@/lib/config";
import type { Budget, DiscoverResult, Mood } from "@/lib/types";

type ResultsPhase = "idle" | "loading" | "results" | "empty" | "error";
type ViewMode = "list" | "one";

export default function Home() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("requesting");
  const [geocodeBusy, setGeocodeBusy] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const [mood, setMood] = useState<Mood | null>(null);
  const [budget, setBudget] = useState<Budget>(2);
  const [radius, setRadius] = useState<number>(DISCOVERY.defaultRadiusMeters);

  const [phase, setPhase] = useState<ResultsPhase>("idle");
  const [result, setResult] = useState<DiscoverResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const resultsRef = useRef<HTMLDivElement>(null);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationLabel("Your location");
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 8000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const handleGeocode = useCallback(async (query: string) => {
    setGeocodeBusy(true);
    setGeocodeError(null);
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = (await response.json()) as {
        lat?: number;
        lng?: number;
        label?: string;
        mock?: boolean;
        error?: string;
      };
      if (!response.ok || typeof data.lat !== "number" || typeof data.lng !== "number") {
        setGeocodeError(data.error ?? "Couldn't find that place — try something nearby.");
        return;
      }
      setCoords({ lat: data.lat, lng: data.lng });
      setLocationLabel(data.mock ? `${query} (demo)` : (data.label ?? query));
      setLocationStatus("manual");
    } catch {
      setGeocodeError("Couldn't find that place — check your connection and try again.");
    } finally {
      setGeocodeBusy(false);
    }
  }, []);

  const find = useCallback(
    async (mode: ViewMode) => {
      if (!coords || !mood) return;
      setViewMode(mode);
      setPhase("loading");
      setErrorMessage(null);
      try {
        const response = await fetch("/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...coords, mood, budget, radiusMeters: radius }),
        });
        const data = (await response.json()) as DiscoverResult & { error?: string };
        if (!response.ok) {
          setErrorMessage(data.error ?? null);
          setPhase("error");
          return;
        }
        setResult(data);
        setPhase(data.cards.length > 0 ? "results" : "empty");
      } catch {
        setErrorMessage("Check your connection and try again.");
        setPhase("error");
      }
    },
    [coords, mood, budget, radius],
  );

  useEffect(() => {
    if (phase === "results" || phase === "empty") {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [phase]);

  const ready = coords !== null && mood !== null;
  const loading = phase === "loading";
  const showOthers = result !== null && result.cards.length > 1;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
      <header className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-primary-deep">Dishcover</h1>
        <p className="mt-1 text-sm text-muted">
          What to eat near you — decided in 30 seconds.
        </p>
      </header>

      <section aria-label="Search" className="space-y-5">
        <div>
          <LocationField
            status={locationStatus}
            label={locationLabel}
            busy={geocodeBusy}
            onUseMyLocation={requestLocation}
            onSubmitQuery={handleGeocode}
          />
          {geocodeError && (
            <p className="mt-1 text-sm text-primary-deep" role="alert">
              {geocodeError}
            </p>
          )}
        </div>

        <MoodChips value={mood} onChange={setMood} />
        <BudgetPicker value={budget} onChange={setBudget} />
        <DistancePicker value={radius} onChange={setRadius} />

        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={!ready || loading}
            onClick={() => find("list")}
            className="min-h-12 w-full rounded-2xl bg-primary text-base font-bold text-white transition-colors hover:bg-primary-deep disabled:opacity-40"
          >
            {loading ? "Finding food…" : "Find food"}
          </button>
          <button
            type="button"
            disabled={!ready || loading}
            onClick={() => {
              if (phase === "results" && result) {
                setViewMode("one");
              } else {
                void find("one");
              }
            }}
            className="min-h-11 w-full rounded-2xl border border-line bg-card text-sm font-semibold text-ink transition-colors hover:border-primary disabled:opacity-40"
          >
            Just pick one for me
          </button>
          {!ready && (
            <p className="text-center text-xs text-muted">
              {coords ? "Pick a mood to start." : "Set a location to start."}
            </p>
          )}
        </div>
      </section>

      <div ref={resultsRef} aria-live="polite" className="mt-8 space-y-3">
        {loading && (
          <>
            <span className="sr-only">Searching for restaurants…</span>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {phase === "error" && (
          <ErrorState message={errorMessage ?? undefined} onRetry={() => void find(viewMode)} />
        )}

        {phase === "empty" && (
          <>
            {result?.mock && <DemoBanner />}
            <EmptyState />
          </>
        )}

        {phase === "results" && result && (
          <>
            {result.mock && <DemoBanner />}
            {result.widened && <WidenedNotice />}

            {viewMode === "one" ? (
              <>
                <h2 className="text-sm font-semibold text-muted">Our pick for you</h2>
                <ResultCard card={result.cards[0]} highlight />
                {showOthers && (
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className="min-h-11 w-full rounded-2xl border border-line bg-card text-sm font-semibold transition-colors hover:border-primary"
                  >
                    Show me others
                  </button>
                )}
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-muted">
                  {result.cards.length === 1
                    ? "The match nearby"
                    : `Top ${result.cards.length} nearby`}
                </h2>
                {result.cards.map((card) => (
                  <ResultCard key={card.placeId} card={card} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
