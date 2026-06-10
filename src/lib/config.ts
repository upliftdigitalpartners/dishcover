import type { Budget, Dietary, Mood } from "./types";

interface MoodConfig {
  label: string;
  /** Decorative — always rendered aria-hidden. */
  emoji: string;
  /** Hard filter: candidates below this rating are dropped (null = use baseline). */
  minRating: number | null;
  /** Hard filters on price level (null = no bound). Unknown price always passes. */
  minPriceLevel: Budget | null;
  maxPriceLevel: Budget | null;
  /** Soft boost when the place has any of these Places types. */
  preferredTypes: string[];
  /** Soft penalty when the place has any of these types. */
  disfavoredTypes: string[];
  /** Soft boost when the place name matches any of these (case-insensitive). */
  keywords: string[];
  /** Hard filter: drop known chains entirely. */
  excludeChains: boolean;
  /** Multiplies the distance weight — >1 means "closer matters more for this mood". */
  distanceWeightMultiplier: number;
  /** Why-it-matches template. Tokens: {walk} (minutes), {rating}. */
  whyTemplate: string;
}

const FAST_CASUAL_TYPES = [
  "fast_food_restaurant",
  "meal_takeaway",
  "sandwich_shop",
  "hamburger_restaurant",
  "food_court",
  "bakery",
];

/**
 * The single tuning surface for discovery: mood biases, ranking weights,
 * radii, and the known-chain exclusion list. Tweak here, nowhere else.
 */
export const DISCOVERY = {
  defaultRadiusMeters: 800, // ~10-min walk
  widenedRadiusMeters: 2000, // ~25-min walk, used by the one auto-widen retry
  walkMetersPerMinute: 80,
  minResults: 3,
  maxResults: 5,
  candidatePoolSize: 20,
  /** Hard rating floor applied to every mood unless the mood sets its own. */
  baselineMinRating: 3.8,
  insightsFreshDays: 30,

  /** Relative importance of each ranking component (each scored 0–1). */
  weights: {
    moodFit: 0.35,
    rating: 0.25,
    reviewCount: 0.1,
    distance: 0.2,
    budgetFit: 0.1,
  },

  moods: {
    "quick-bite": {
      label: "Quick bite",
      emoji: "⚡",
      minRating: null,
      minPriceLevel: null,
      maxPriceLevel: 2,
      preferredTypes: FAST_CASUAL_TYPES,
      disfavoredTypes: ["fine_dining_restaurant"],
      keywords: ["taqueria", "deli", "counter", "express"],
      excludeChains: false,
      distanceWeightMultiplier: 2,
      whyTemplate: "In and out fast — about {walk} min on foot",
    },
    "local-authentic": {
      label: "Local & authentic",
      emoji: "🥘",
      minRating: 4.3,
      minPriceLevel: null,
      maxPriceLevel: null,
      preferredTypes: [],
      disfavoredTypes: FAST_CASUAL_TYPES,
      keywords: ["family", "house", "casa", "original"],
      excludeChains: true,
      distanceWeightMultiplier: 1,
      whyTemplate: "A neighborhood spot locals rate {rating}★",
    },
    "cozy-sit-down": {
      label: "Cozy sit-down",
      emoji: "🕯️",
      minRating: 4.2,
      minPriceLevel: null,
      maxPriceLevel: null,
      preferredTypes: ["italian_restaurant", "french_restaurant", "wine_bar"],
      disfavoredTypes: FAST_CASUAL_TYPES,
      keywords: ["bistro", "trattoria", "osteria", "kitchen", "hearth"],
      excludeChains: false,
      distanceWeightMultiplier: 1,
      whyTemplate: "Settle in — a proper sit-down at {rating}★",
    },
    "treat-yourself": {
      label: "Treat yourself",
      emoji: "✨",
      minRating: 4.4,
      minPriceLevel: 3,
      maxPriceLevel: null,
      preferredTypes: ["fine_dining_restaurant", "sushi_restaurant", "steak_house"],
      disfavoredTypes: FAST_CASUAL_TYPES,
      keywords: ["omakase", "tasting", "chef"],
      excludeChains: false,
      distanceWeightMultiplier: 0.75,
      whyTemplate: "Worth the splurge at {rating}★",
    },
    "late-night": {
      label: "Late night",
      emoji: "🌙",
      minRating: null,
      minPriceLevel: null,
      maxPriceLevel: null,
      preferredTypes: ["bar", "diner", "ramen_restaurant", "pizza_restaurant"],
      disfavoredTypes: [],
      keywords: ["late", "24", "midnight", "noodle", "diner"],
      excludeChains: false,
      distanceWeightMultiplier: 1.25,
      whyTemplate: "Open and serving — {walk} min away",
    },
    "light-healthy": {
      label: "Light & healthy",
      emoji: "🥗",
      minRating: null,
      minPriceLevel: null,
      maxPriceLevel: null,
      preferredTypes: [
        "salad_bar",
        "vegetarian_restaurant",
        "vegan_restaurant",
        "mediterranean_restaurant",
        "juice_shop",
      ],
      disfavoredTypes: ["fast_food_restaurant", "hamburger_restaurant", "steak_house"],
      keywords: ["salad", "poke", "vegetarian", "vegan", "mediterranean", "juice", "bowl", "greens"],
      excludeChains: false,
      distanceWeightMultiplier: 1,
      whyTemplate: "Fresh and light, {walk} min on foot",
    },
  } satisfies Record<Mood, MoodConfig>,

  /**
   * Known-chain exclusion list (lowercase substrings matched against names)
   * for moods with excludeChains. Places has no chain/brand field, so this
   * heuristic list is the mechanism. Extend freely.
   */
  chains: [
    "mcdonald",
    "burger king",
    "wendy's",
    "kfc",
    "subway",
    "starbucks",
    "dunkin",
    "domino",
    "pizza hut",
    "papa john",
    "taco bell",
    "chipotle",
    "five guys",
    "popeyes",
    "chick-fil-a",
    "panda express",
    "shake shack",
    "panera",
    "applebee",
    "olive garden",
    "tgi friday",
    "denny's",
    "ihop",
    "nando",
    "pret a manger",
  ],
} as const;

export const MOOD_KEYS = Object.keys(DISCOVERY.moods) as Mood[];

interface DietaryConfig {
  label: string;
  /** Term injected into the Places Text Search query when this need is active. */
  searchTerm: string;
  /** Name substrings that signal this accommodation (lowercase). */
  keywords: string[];
  /** Places types that signal this accommodation. */
  types: string[];
}

/**
 * Dietary needs. Real-mode discovery switches to Text Search with these terms
 * (Google matches halal/kosher/veg from listings + reviews far better than we
 * can from a name); keywords/types add per-place badge signals on top.
 */
export const DIETARY: Record<Dietary, DietaryConfig> = {
  halal: {
    label: "Halal",
    searchTerm: "halal",
    keywords: ["halal"],
    types: [],
  },
  kosher: {
    label: "Kosher",
    searchTerm: "kosher",
    keywords: ["kosher", "glatt"],
    types: [],
  },
  vegetarian: {
    label: "Vegetarian",
    searchTerm: "vegetarian",
    keywords: ["vegetarian", "veggie", "plant-based", "plant based"],
    types: ["vegetarian_restaurant", "vegan_restaurant"],
  },
  vegan: {
    label: "Vegan",
    searchTerm: "vegan",
    keywords: ["vegan", "plant-based", "plant based"],
    types: ["vegan_restaurant"],
  },
};

export const DIETARY_KEYS = Object.keys(DIETARY) as Dietary[];

export function isKnownChain(name: string): boolean {
  const lower = name.toLowerCase();
  return DISCOVERY.chains.some((chain) => lower.includes(chain));
}

/** Dietary signals detectable from a place's own name and types. */
export function detectDietary(name: string, types: string[]): Dietary[] {
  const lower = name.toLowerCase();
  return DIETARY_KEYS.filter((key) => {
    const cfg = DIETARY[key];
    return (
      cfg.keywords.some((keyword) => lower.includes(keyword)) ||
      types.some((type) => cfg.types.includes(type))
    );
  });
}
