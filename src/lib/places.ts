import { detectDietary, DIETARY, DISCOVERY } from "./config";
import { getEnv } from "./env";
import { DEFAULT_TIMEOUT_MS, fetchWithTimeout } from "./http";
import type { Budget, Candidate, Dietary } from "./types";

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

/**
 * Why a Places call failed, in the only terms the caller can act on:
 * - `denied`   — key rejected (restricted to referrers/IPs, API not enabled,
 *                billing off). Config problem; retrying never helps.
 * - `request`  — we sent something Google rejected (4xx). Our bug.
 * - `quota`    — rate limited.
 * - `upstream` — Google 5xx.
 * - `timeout` / `network` — never got an answer.
 */
export type PlacesFailureKind =
  | "denied"
  | "request"
  | "quota"
  | "upstream"
  | "timeout"
  | "network";

export class PlacesError extends Error {
  readonly kind: PlacesFailureKind;
  readonly status: number | null;
  /** Google's own explanation, trimmed — the thing worth reading in a log. */
  readonly detail: string;

  constructor(kind: PlacesFailureKind, status: number | null, detail: string) {
    super(`Places ${kind}${status === null ? "" : ` ${status}`}: ${detail}`);
    this.name = "PlacesError";
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }

  /** Config and request errors are permanent; the rest may heal on a retry. */
  get transient(): boolean {
    return this.kind !== "denied" && this.kind !== "request";
  }
}

/** Google's error envelope: {error: {code, message, status}}. */
function describeFailure(status: number, body: string): PlacesError {
  let detail = body.slice(0, 300);
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; status?: string } };
    if (parsed.error?.message) {
      detail = parsed.error.status
        ? `${parsed.error.status}: ${parsed.error.message}`
        : parsed.error.message;
    }
  } catch {
    // Non-JSON body (a proxy or an HTML error page) — the raw text is the detail.
  }

  // A restricted key or a disabled API is a 403; an outright invalid one comes
  // back as 400 INVALID_ARGUMENT. Both are "fix your key", not "fix the query".
  if (status === 401 || status === 403 || /api key/i.test(detail)) {
    return new PlacesError("denied", status, detail);
  }
  if (status === 429) return new PlacesError("quota", status, detail);
  if (status >= 500) return new PlacesError("upstream", status, detail);
  return new PlacesError("request", status, detail);
}

/** Node rejects a timed-out fetch with a TimeoutError; older runtimes wrap it. */
function isTimeout(error: unknown): boolean {
  const named = error as { name?: string; cause?: { name?: string } };
  return named?.name === "TimeoutError" || named?.cause?.name === "TimeoutError";
}

/** Network failures hide the useful part (DNS, TLS, ECONNREFUSED) in `cause`. */
function describeNetworkError(error: unknown): string {
  const cause = (error as { cause?: unknown }).cause;
  return cause ? `${String(error)} (${String(cause)})` : String(error);
}

const RETRY_DELAY_MS = 300;
/** Second attempt gets a tighter budget so a slow upstream can't stall the request. */
const RETRY_TIMEOUT_MS = 4000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface RawPlace {
  id?: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  currentOpeningHours?: { openNow?: boolean; nextCloseTime?: string };
  formattedAddress?: string;
  reviews?: { text?: { text?: string }; rating?: number }[];
}

type PlacesInit = { method: "GET" } | { method: "POST"; body: unknown };

async function attempt(
  path: string,
  fieldMask: string,
  init: PlacesInit,
  timeoutMs: number,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${BASE}${path}`,
      {
        method: init.method,
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": getEnv().googlePlacesApiKey,
          "X-Goog-FieldMask": fieldMask,
        },
        ...(init.method === "POST" ? { body: JSON.stringify(init.body) } : {}),
      },
      timeoutMs,
    );
  } catch (error) {
    // A timeout or DNS/TLS/socket trouble — no status code was ever returned.
    throw isTimeout(error)
      ? new PlacesError("timeout", null, `no response within ${timeoutMs}ms`)
      : new PlacesError("network", null, describeNetworkError(error));
  }

  if (!response.ok) {
    throw describeFailure(response.status, await response.text().catch(() => ""));
  }
  return response.json();
}

/**
 * Every Places call goes through here. One retry on transient failures — a
 * cold-start timeout or a single 5xx shouldn't cost the user their answer —
 * and no retry on a rejected key, which would only burn latency.
 */
async function placesFetch(
  path: string,
  fieldMask: string,
  init: PlacesInit,
): Promise<unknown> {
  try {
    return await attempt(path, fieldMask, init, DEFAULT_TIMEOUT_MS);
  } catch (error) {
    if (!(error instanceof PlacesError) || !error.transient) throw error;
    console.warn(`Places ${init.method} ${path} failed, retrying once —`, error.message);
    await sleep(RETRY_DELAY_MS);
    return attempt(path, fieldMask, init, RETRY_TIMEOUT_MS);
  }
}

/**
 * Cheapest possible proof that the key works: Text Search with an ID-only
 * field mask (Google's free tier). Used by /api/health, never by discovery.
 */
export async function pingPlaces(): Promise<void> {
  await attempt(
    "/places:searchText",
    "places.id",
    { method: "POST", body: { textQuery: "restaurant", pageSize: 1 } },
    DEFAULT_TIMEOUT_MS,
  );
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
    // Already inside the currentOpeningHours field we pay for — no SKU change.
    closesAt: place.currentOpeningHours?.nextCloseTime ?? null,
    dietary: detectDietary(place.displayName.text, place.types ?? []),
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

/**
 * Dietary-need discovery via Text Search: the query carries the dietary terms
 * ("halal restaurants" etc.) so Google's relevance engine — which sees
 * listings, attributes, and full review history — does the matching. Uses
 * locationBias (circle), so distance is re-enforced by ranking afterwards;
 * unlike Nearby Search, openNow is a real request filter here.
 */
export async function searchDietary(
  lat: number,
  lng: number,
  radiusMeters: number,
  dietary: Dietary[],
): Promise<Candidate[]> {
  const terms = dietary.map((need) => DIETARY[need].searchTerm).join(" ");
  const data = (await placesFetch("/places:searchText", NEARBY_FIELD_MASK, {
    method: "POST",
    body: {
      textQuery: `${terms} restaurants`,
      includedType: "restaurant",
      openNow: true,
      pageSize: DISCOVERY.candidatePoolSize,
      locationBias: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
    },
  })) as { places?: RawPlace[] };

  return (data.places ?? [])
    .map(toCandidate)
    .filter((c): c is Candidate => c !== null)
    // The search itself matched these needs; merge so badges stay truthful
    // even when the name/types alone don't reveal it.
    .map((c) => ({ ...c, dietary: [...new Set([...c.dietary, ...dietary])] }));
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
