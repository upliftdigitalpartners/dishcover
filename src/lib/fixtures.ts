import type { Budget, Candidate, Dietary, Insights } from "./types";

/**
 * Mock-mode data: realistic restaurants positioned relative to wherever the
 * user is, so distances, ranking, and walk times behave like the real thing.
 */

interface Fixture {
  placeId: string;
  name: string;
  bearingDeg: number;
  distanceMeters: number;
  rating: number;
  userRatingCount: number;
  priceLevel: Budget;
  types: string[];
  primaryType: string;
  openNow: boolean;
  /** Minutes from "now" until closing (null = unknown); makes demos timeless. */
  closesInMinutes: number | null;
  dietary: Dietary[];
  insights: Insights;
}

const FIXTURES: Fixture[] = [
  {
    placeId: "mock-la-esquina",
    name: "La Esquina Taqueria",
    bearingDeg: 40,
    distanceMeters: 190,
    rating: 4.6,
    userRatingCount: 812,
    priceLevel: 1,
    types: ["mexican_restaurant", "meal_takeaway", "restaurant"],
    primaryType: "mexican_restaurant",
    openNow: true,
    closesInMinutes: 180,
    dietary: [],
    insights: {
      dishes: [
        { name: "Birria tacos", price: 9, mentions: 14 },
        { name: "Al pastor taco", price: 3.5, mentions: 9 },
        { name: "Horchata", price: 4, mentions: 5 },
      ],
      vibe: "no-frills counter slinging the neighborhood's best birria",
      dietary: [],
    },
  },
  {
    placeId: "mock-lanzhou",
    name: "Lan Zhou Hand-Pulled Noodles",
    bearingDeg: 130,
    distanceMeters: 350,
    rating: 4.7,
    userRatingCount: 954,
    priceLevel: 1,
    types: ["chinese_restaurant", "restaurant"],
    primaryType: "chinese_restaurant",
    openNow: true,
    closesInMinutes: 240,
    dietary: ["halal"],
    insights: {
      dishes: [
        { name: "Beef noodle soup", price: 12, mentions: 22 },
        { name: "Hand-pulled noodles", price: 11, mentions: 17 },
        { name: "Chive pockets", price: 6, mentions: 6 },
      ],
      vibe: "beloved hole-in-the-wall for hand-pulled noodles",
      dietary: ["halal"],
    },
  },
  {
    placeId: "mock-baan-khao-soi",
    name: "Baan Khao Soi",
    bearingDeg: 220,
    distanceMeters: 520,
    rating: 4.6,
    userRatingCount: 486,
    priceLevel: 2,
    types: ["thai_restaurant", "restaurant"],
    primaryType: "thai_restaurant",
    openNow: true,
    closesInMinutes: 150,
    dietary: [],
    insights: {
      dishes: [
        { name: "Khao soi", price: 11, mentions: 14 },
        { name: "Pad thai", price: 12, mentions: 8 },
        { name: "Mango sticky rice", price: 7, mentions: 5 },
      ],
      vibe: "family-run Thai kitchen known for northern specialties",
      dietary: ["vegetarian"],
    },
  },
  {
    placeId: "mock-hearth-vine",
    name: "Hearth & Vine",
    bearingDeg: 300,
    distanceMeters: 650,
    rating: 4.4,
    userRatingCount: 678,
    priceLevel: 3,
    types: ["italian_restaurant", "wine_bar", "restaurant"],
    primaryType: "italian_restaurant",
    openNow: true,
    closesInMinutes: 200,
    dietary: [],
    insights: {
      dishes: [
        { name: "Wood-fired gnocchi", price: 19, mentions: 11 },
        { name: "Burrata", price: 14, mentions: 7 },
        { name: "Tiramisu", price: 9, mentions: 6 },
      ],
      vibe: "candlelit corner spot made for lingering",
      dietary: [],
    },
  },
  {
    placeId: "mock-maru",
    name: "Maru Omakase",
    bearingDeg: 75,
    distanceMeters: 1400,
    rating: 4.8,
    userRatingCount: 214,
    priceLevel: 4,
    types: ["sushi_restaurant", "japanese_restaurant", "fine_dining_restaurant", "restaurant"],
    primaryType: "sushi_restaurant",
    openNow: true,
    closesInMinutes: 170,
    dietary: [],
    insights: {
      dishes: [
        { name: "Chef's omakase", price: 95, mentions: 19 },
        { name: "Toro hand roll", price: 12, mentions: 4 },
      ],
      vibe: "intimate ten-seat sushi counter",
      dietary: [],
    },
  },
  {
    placeId: "mock-owl-diner",
    name: "The Owl Diner",
    bearingDeg: 170,
    distanceMeters: 480,
    rating: 4.2,
    userRatingCount: 1530,
    priceLevel: 1,
    types: ["diner", "american_restaurant", "restaurant"],
    primaryType: "diner",
    openNow: true,
    closesInMinutes: 840,
    dietary: [],
    insights: {
      dishes: [
        { name: "Smash burger", price: 10, mentions: 16 },
        { name: "Disco fries", price: 8, mentions: 12 },
        { name: "Banana pancakes", price: 9, mentions: 7 },
      ],
      vibe: "24-hour booth-and-counter classic",
      dietary: [],
    },
  },
  {
    placeId: "mock-verdura",
    name: "Verdura",
    bearingDeg: 350,
    distanceMeters: 410,
    rating: 4.5,
    userRatingCount: 342,
    priceLevel: 2,
    types: ["vegetarian_restaurant", "salad_bar", "restaurant"],
    primaryType: "vegetarian_restaurant",
    openNow: true,
    closesInMinutes: 40,
    dietary: ["vegetarian", "vegan"],
    insights: {
      dishes: [
        { name: "Harvest grain bowl", price: 13, mentions: 9 },
        { name: "Green goddess salad", price: 12, mentions: 7 },
        { name: "Cold-pressed juice", price: 8, mentions: 3 },
      ],
      vibe: "bright counter spot for serious salads",
      dietary: ["vegetarian", "vegan"],
    },
  },
  {
    placeId: "mock-saffron-grill",
    name: "Saffron Halal Grill",
    bearingDeg: 15,
    distanceMeters: 300,
    rating: 4.5,
    userRatingCount: 620,
    priceLevel: 1,
    types: ["middle_eastern_restaurant", "meal_takeaway", "restaurant"],
    primaryType: "middle_eastern_restaurant",
    openNow: true,
    closesInMinutes: 600,
    dietary: ["halal"],
    insights: {
      dishes: [
        { name: "Chicken over rice", price: 11, mentions: 18 },
        { name: "Lamb shawarma", price: 13, mentions: 9 },
        { name: "Baklava", price: 5, mentions: 4 },
      ],
      vibe: "late-night halal cart that earned four walls",
      dietary: ["halal"],
    },
  },
  {
    placeId: "mock-beteavon",
    name: "Beteavon Kosher Deli",
    bearingDeg: 200,
    distanceMeters: 550,
    rating: 4.4,
    userRatingCount: 389,
    priceLevel: 2,
    types: ["deli", "sandwich_shop", "restaurant"],
    primaryType: "deli",
    openNow: true,
    closesInMinutes: 90,
    dietary: ["kosher"],
    insights: {
      dishes: [
        { name: "Pastrami on rye", price: 16, mentions: 15 },
        { name: "Matzo ball soup", price: 9, mentions: 11 },
        { name: "Black & white cookie", price: 4, mentions: 3 },
      ],
      vibe: "old-school kosher deli stacked impossibly high",
      dietary: ["kosher"],
    },
  },
  {
    placeId: "mock-mcdonalds",
    name: "McDonald's",
    bearingDeg: 100,
    distanceMeters: 230,
    rating: 3.9,
    userRatingCount: 2100,
    priceLevel: 1,
    types: ["fast_food_restaurant", "hamburger_restaurant", "meal_takeaway", "restaurant"],
    primaryType: "fast_food_restaurant",
    openNow: true,
    closesInMinutes: 300,
    dietary: [],
    insights: {
      dishes: [
        { name: "Big Mac", price: 6, mentions: 3 },
        { name: "Fries", price: 4, mentions: 2 },
      ],
      vibe: "the golden arches, exactly as you know them",
      dietary: [],
    },
  },
  {
    placeId: "mock-casa-lumbre",
    name: "Casa Lumbre",
    bearingDeg: 260,
    distanceMeters: 700,
    rating: 4.5,
    userRatingCount: 530,
    priceLevel: 3,
    types: ["mexican_restaurant", "restaurant"],
    primaryType: "mexican_restaurant",
    openNow: false, // exercises the open-now filter in demos
    closesInMinutes: null,
    dietary: [],
    insights: {
      dishes: [
        { name: "Mole negro", price: 24, mentions: 10 },
        { name: "Mezcal flight", price: 18, mentions: 6 },
      ],
      vibe: "moody mezcaleria with serious Oaxacan cooking",
      dietary: [],
    },
  },
];

const METERS_PER_DEGREE_LAT = 111_320;

function offsetPosition(lat: number, lng: number, bearingDeg: number, distanceMeters: number) {
  const bearing = (bearingDeg * Math.PI) / 180;
  const dLat = (distanceMeters * Math.cos(bearing)) / METERS_PER_DEGREE_LAT;
  const dLng =
    (distanceMeters * Math.sin(bearing)) /
    (METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

/** Mock equivalent of Places search, centered on the caller. */
export function mockNearby(
  lat: number,
  lng: number,
  radiusMeters: number,
  dietary: Dietary[] = [],
): Candidate[] {
  return FIXTURES.filter(
    (f) =>
      f.distanceMeters <= radiusMeters &&
      dietary.every((need) => f.dietary.includes(need)),
  ).map((f) => {
    const pos = offsetPosition(lat, lng, f.bearingDeg, f.distanceMeters);
    return {
      placeId: f.placeId,
      name: f.name,
      lat: pos.lat,
      lng: pos.lng,
      rating: f.rating,
      userRatingCount: f.userRatingCount,
      priceLevel: f.priceLevel,
      types: f.types,
      primaryType: f.primaryType,
      openNow: f.openNow,
      closesAt:
        f.closesInMinutes === null
          ? null
          : new Date(Date.now() + f.closesInMinutes * 60_000).toISOString(),
      dietary: f.dietary,
    };
  });
}

/** Mock equivalent of the insights lookup (store/extraction). */
export function mockInsights(placeId: string): Insights {
  const fixture = FIXTURES.find((f) => f.placeId === placeId);
  return fixture ? fixture.insights : { dishes: [], vibe: null, dietary: [] };
}

/** Mock geocode for the "Where are you?" fallback — a fixed demo location. */
export const MOCK_LOCATION = {
  lat: 40.7359,
  lng: -73.9911,
  label: "Demo location",
};
