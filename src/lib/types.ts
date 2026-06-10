export type Mood =
  | "quick-bite"
  | "local-authentic"
  | "cozy-sit-down"
  | "treat-yourself"
  | "late-night"
  | "light-healthy";

/** 1–4 ↔ $–$$$$ (normalized from Places' PRICE_LEVEL_* enum). */
export type Budget = 1 | 2 | 3 | 4;

export interface Dish {
  name: string;
  price: number | null;
  mentions: number;
}

/** What the LLM extraction (or the store) knows about a place. */
export interface Insights {
  dishes: Dish[];
  vibe: string | null;
}

/** A nearby place, normalized — identical shape from the mock and Places providers. */
export interface Candidate {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: Budget | null;
  types: string[];
  primaryType: string | null;
  openNow: boolean | null;
}

export interface DiscoverInput {
  lat: number;
  lng: number;
  mood: Mood;
  budget: Budget;
  radiusMeters?: number;
}

export interface ResultCardData {
  placeId: string;
  name: string;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: Budget | null;
  walkMinutes: number;
  dishes: Dish[];
  whyLine: string;
  directionsUrl: string;
}

export interface DiscoverResult {
  cards: ResultCardData[];
  /** True when the radius was auto-widened to find enough matches. */
  widened: boolean;
  radiusMeters: number;
  /** True when serving fixture data because API keys are missing. */
  mock: boolean;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
  mock: boolean;
}
