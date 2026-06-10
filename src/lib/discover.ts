import { DISCOVERY } from "./config";
import { isMockMode } from "./env";
import { MOCK_LOCATION, mockInsights, mockNearby } from "./fixtures";
import { geocodeText, searchNearby } from "./places";
import { buildWhyLine, directionsUrl, rankCandidates, type RankedCandidate } from "./rank";
import type {
  Candidate,
  DiscoverInput,
  DiscoverResult,
  GeocodeResult,
  Insights,
  ResultCardData,
} from "./types";

/** Provider seam: Places Nearby Search, or fixtures when keys are missing. */
async function getCandidates(lat: number, lng: number, radiusMeters: number): Promise<Candidate[]> {
  if (isMockMode()) {
    return mockNearby(lat, lng, radiusMeters);
  }
  return searchNearby(lat, lng, radiusMeters);
}

/**
 * Insights seam: fixture data in mock mode; read-through store + extraction
 * in the real path. Must never throw — a place without insights still renders.
 */
async function getInsights(candidate: Candidate): Promise<Insights> {
  if (isMockMode()) {
    return mockInsights(candidate.placeId);
  }
  // Real path (Place Details → Groq → Supabase) lands in later slices.
  return { dishes: [], vibe: null };
}

function toCard(candidate: RankedCandidate, insights: Insights, mood: DiscoverInput["mood"]): ResultCardData {
  return {
    placeId: candidate.placeId,
    name: candidate.name,
    rating: candidate.rating,
    userRatingCount: candidate.userRatingCount,
    priceLevel: candidate.priceLevel,
    walkMinutes: candidate.walkMinutes,
    dishes: insights.dishes.slice(0, 3),
    whyLine: buildWhyLine(mood, candidate, insights.vibe),
    directionsUrl: directionsUrl(candidate.name, candidate.placeId),
  };
}

export async function discover(input: DiscoverInput): Promise<DiscoverResult> {
  const mock = isMockMode();
  const origin = { lat: input.lat, lng: input.lng };
  const requestedRadius = Math.min(
    input.radiusMeters ?? DISCOVERY.defaultRadiusMeters,
    DISCOVERY.widenedRadiusMeters,
  );

  let radius = requestedRadius;
  let ranked = rankCandidates(
    await getCandidates(input.lat, input.lng, radius),
    input.mood,
    input.budget,
    origin,
    radius,
  );

  // Too few matches → one auto-widen retry, surfaced to the user via `widened`.
  let widened = false;
  if (ranked.length < DISCOVERY.minResults && requestedRadius < DISCOVERY.widenedRadiusMeters) {
    radius = DISCOVERY.widenedRadiusMeters;
    ranked = rankCandidates(
      await getCandidates(input.lat, input.lng, radius),
      input.mood,
      input.budget,
      origin,
      radius,
    );
    widened = true;
  }

  const top = ranked.slice(0, DISCOVERY.maxResults);

  // Per-place insights in parallel; any single failure degrades to a card
  // without "Order this" rather than failing the response.
  const insights = await Promise.all(
    top.map((candidate) =>
      getInsights(candidate).catch((): Insights => ({ dishes: [], vibe: null })),
    ),
  );

  return {
    cards: top.map((candidate, i) => toCard(candidate, insights[i], input.mood)),
    widened,
    radiusMeters: radius,
    mock,
  };
}

export async function geocode(query: string): Promise<GeocodeResult> {
  if (isMockMode()) {
    return { ...MOCK_LOCATION, mock: true };
  }
  const located = await geocodeText(query);
  if (!located) {
    throw new Error(`No geocode result for query: ${query}`);
  }
  return { ...located, mock: false };
}
