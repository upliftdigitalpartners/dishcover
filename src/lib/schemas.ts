import { z } from "zod";
import { MOOD_KEYS } from "./config";
import type { Mood } from "./types";

export const discoverRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  mood: z.enum(MOOD_KEYS as [Mood, ...Mood[]]),
  budget: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  radiusMeters: z.number().min(100).max(3000).optional(),
});

export type DiscoverRequest = z.infer<typeof discoverRequestSchema>;

export const geocodeRequestSchema = z.object({
  query: z.string().trim().min(2).max(120),
});

/**
 * Contract for the LLM extraction output. Groq's json_object mode guarantees
 * valid JSON, not a valid shape — this schema is the real gate. Anything that
 * fails it becomes "no dishes found", never an error.
 */
export const extractionSchema = z.object({
  dishes: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        price: z.number().min(0).max(1000).nullable().catch(null),
        mentions: z.number().int().min(1).max(99).catch(1),
      }),
    )
    .max(8)
    .catch([]),
  vibe: z.string().trim().max(120).nullable().catch(null),
});

export type Extraction = z.infer<typeof extractionSchema>;
