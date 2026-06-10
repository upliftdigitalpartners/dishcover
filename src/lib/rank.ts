import { DISCOVERY, isKnownChain } from "./config";
import type { Budget, Candidate, Mood } from "./types";

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function walkMinutes(distanceMeters: number): number {
  return Math.max(1, Math.round(distanceMeters / DISCOVERY.walkMetersPerMinute));
}

export interface RankedCandidate extends Candidate {
  score: number;
  distanceMeters: number;
  walkMinutes: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function moodFitScore(candidate: Candidate, mood: Mood): number {
  const cfg = DISCOVERY.moods[mood];
  const lowerName = candidate.name.toLowerCase();
  let fit = 0.5;
  if (candidate.types.some((t) => (cfg.preferredTypes as readonly string[]).includes(t))) {
    fit += 0.3;
  }
  if (candidate.types.some((t) => (cfg.disfavoredTypes as readonly string[]).includes(t))) {
    fit -= 0.3;
  }
  if (cfg.keywords.some((k) => lowerName.includes(k))) {
    fit += 0.2;
  }
  return clamp01(fit);
}

function passesHardFilters(candidate: Candidate, mood: Mood, budget: Budget): boolean {
  const cfg = DISCOVERY.moods[mood];

  // Open now is the default promise of the app; unknown (null) gets the benefit
  // of the doubt so sparse data doesn't empty the results.
  if (candidate.openNow === false) return false;

  const minRating = cfg.minRating ?? DISCOVERY.baselineMinRating;
  if (candidate.rating !== null && candidate.rating < minRating) return false;

  if (candidate.priceLevel !== null) {
    if (cfg.minPriceLevel !== null && candidate.priceLevel < cfg.minPriceLevel) return false;
    if (cfg.maxPriceLevel !== null && candidate.priceLevel > cfg.maxPriceLevel) return false;
    // Budget is a preference, not a straitjacket: one level off survives
    // (penalized in scoring), two or more levels off is filtered out.
    if (Math.abs(candidate.priceLevel - budget) >= 2) return false;
  }

  if (cfg.excludeChains && isKnownChain(candidate.name)) return false;

  return true;
}

/**
 * Filter to mood/budget-viable candidates and rank by the weighted score
 * from DISCOVERY.weights. Deterministic — no LLM involved.
 */
export function rankCandidates(
  candidates: Candidate[],
  mood: Mood,
  budget: Budget,
  origin: { lat: number; lng: number },
  radiusMeters: number,
): RankedCandidate[] {
  const cfg = DISCOVERY.moods[mood];
  const { weights } = DISCOVERY;

  const ranked = candidates
    .filter((c) => passesHardFilters(c, mood, budget))
    .map((c) => {
      const distanceMeters = haversineMeters(origin.lat, origin.lng, c.lat, c.lng);

      const ratingScore = c.rating === null ? 0.3 : clamp01((c.rating - 3.5) / 1.5);
      const reviewScore =
        c.userRatingCount === null
          ? 0.3
          : clamp01(Math.log10(c.userRatingCount + 1) / 3);
      const distanceScore = clamp01(1 - distanceMeters / radiusMeters);
      const budgetScore =
        c.priceLevel === null ? 0.4 : c.priceLevel === budget ? 1 : 0.5;

      const score =
        weights.moodFit * moodFitScore(c, mood) +
        weights.rating * ratingScore +
        weights.reviewCount * reviewScore +
        weights.distance * distanceScore * cfg.distanceWeightMultiplier +
        weights.budgetFit * budgetScore;

      return {
        ...c,
        score,
        distanceMeters,
        walkMinutes: walkMinutes(distanceMeters),
      };
    });

  return ranked.sort((a, b) => b.score - a.score);
}

/** One-line why-it-matches: mood template + extracted vibe. Deterministic. */
export function buildWhyLine(
  mood: Mood,
  candidate: RankedCandidate,
  vibe: string | null,
): string {
  const filled = DISCOVERY.moods[mood].whyTemplate
    .replace("{walk}", String(candidate.walkMinutes))
    .replace("{rating}", candidate.rating !== null ? candidate.rating.toFixed(1) : "—");
  return vibe ? `${filled} · ${vibe}` : filled;
}

export function directionsUrl(name: string, placeId: string): string {
  const params = new URLSearchParams({ api: "1", destination: name });
  // Mock place ids would 404 in Google Maps; name-only links still work.
  if (!placeId.startsWith("mock-")) {
    params.set("destination_place_id", placeId);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
