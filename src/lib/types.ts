export type Mood =
  | "quick-bite"
  | "local-authentic"
  | "cozy-sit-down"
  | "treat-yourself"
  | "late-night"
  | "light-healthy";

export type Dietary = "halal" | "kosher" | "vegetarian" | "vegan";

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
  /** Dietary accommodations the reviews clearly support — never guessed. */
  dietary: Dietary[];
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
  /** ISO timestamp of the next closing time, when Google provides it. */
  closesAt: string | null;
  /** Dietary signals from the provider (place types, name, search match). */
  dietary: Dietary[];
}

export interface DiscoverInput {
  lat: number;
  lng: number;
  mood: Mood;
  budget: Budget;
  radiusMeters?: number;
  dietary?: Dietary[];
}

export interface ResultCardData {
  placeId: string;
  name: string;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: Budget | null;
  walkMinutes: number;
  closesAt: string | null;
  dishes: Dish[];
  dietary: Dietary[];
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
