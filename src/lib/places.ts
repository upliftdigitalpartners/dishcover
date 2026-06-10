import { DISCOVERY } from "./config";
import { getEnv } from "./env";
import { fetchWithTimeout } from "./http";
import type { Budget, Candidate } from "./types";

/**
 * Google Places API (New) client — places.googleapis.com/v1 only.
 *
 * Field masks are deliberate cost decisions (each request bills at the most
 * expensive SKU any masked field triggers):
 * - Nearby Search mask below = Enterprise tier. Adding `places.reviews` would
 *   bump every search to Enterprise+Atmosphere — reviews are fetched per-place
 *   via Place Details, and only for top-5 cache misses.
 * - Search endpoints prefix fields with `places.`; Place Details uses bare names.
 */

const BASE = "https://places.googleapis.com/v1";

const NEARBY_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.currentOpeningHours",
].join(",");

const DETAILS_FIELD_MASK = ["id", "displayName", "reviews"].join(",");

const GEOCODE_FIELD_MASK = [
  "places.location",
  "places.displayName",
  "places.formattedAddress",
].join(",");

const PRICE_LEVELS: Record<string, Budget> = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

interface RawPlace {
  id?: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  currentOpeningHours?: { openNow?: boolean };
  formattedAddress?: string;
  reviews?: { text?: { text?: string }; rating?: number }[];
}

async function placesFetch(
  path: string,
  fieldMask: string,
  init: { method: "GET" } | { method: "POST"; body: unknown },
): Promise<unknown> {
  const response = await fetchWithTimeout(`${BASE}${path}`, {
    method: init.method,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getEnv().googlePlacesApiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    ...(init.method === "POST" ? { body: JSON.stringify(init.body) } : {}),
  });
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`Places API ${init.method} ${path} → ${response.status}: ${detail}`);
  }
  return response.json();
}

function toCandidate(place: RawPlace): Candidate | null {
  if (
    !place.id ||
    !place.displayName?.text ||
    place.location?.latitude === undefined ||
    place.location?.longitude === undefined
  ) {
    return null;
  }
  return {
    placeId: place.id,
    name: place.displayName.text,
    lat: place.location.latitude,
    lng: place.location.longitude,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    priceLevel: (place.priceLevel && PRICE_LEVELS[place.priceLevel]) || null,
    types: place.types ?? [],
    primaryType: place.primaryType ?? null,
    // Nearby Search has no openNow request filter — ranking post-filters on this.
    openNow: place.currentOpeningHours?.openNow ?? null,
  };
}

export async function searchNearby(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<Candidate[]> {
  const data = (await placesFetch("/places:searchNearby", NEARBY_FIELD_MASK, {
    method: "POST",
    body: {
      includedTypes: ["restaurant"],
      maxResultCount: DISCOVERY.candidatePoolSize,
      rankPreference: "POPULARITY",
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
    },
  })) as { places?: RawPlace[] };

  return (data.places ?? [])
    .map(toCandidate)
    .filter((c): c is Candidate => c !== null);
}

/** Review texts for one place — max 5, Google's relevance order. */
export async function fetchReviews(placeId: string): Promise<string[]> {
  const data = (await placesFetch(
    `/places/${encodeURIComponent(placeId)}`,
    DETAILS_FIELD_MASK,
    { method: "GET" },
  )) as RawPlace;

  return (data.reviews ?? [])
    .map((review) => review.text?.text?.trim() ?? "")
    .filter((text) => text.length > 0);
}

export async function geocodeText(
  query: string,
): Promise<{ lat: number; lng: number; label: string } | null> {
  const data = (await placesFetch("/places:searchText", GEOCODE_FIELD_MASK, {
    method: "POST",
    body: { textQuery: query, pageSize: 1 },
  })) as { places?: RawPlace[] };

  const place = data.places?.[0];
  const location = place?.location;
  if (location?.latitude === undefined || location.longitude === undefined) {
    return null;
  }
  return {
    lat: location.latitude,
    lng: location.longitude,
    label: place?.displayName?.text ?? place?.formattedAddress ?? query,
  };
}
