import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DISCOVERY } from "./config";
import { getEnv } from "./env";
import { extractDishes } from "./extract";
import { fetchWithTimeout } from "./http";
import { fetchReviews } from "./places";
import { extractionSchema } from "./schemas";
import type { Candidate, Insights } from "./types";

/**
 * Read-through store over place_insights. The table is a permanent, growing
 * dataset — rows are never deleted, only refreshed once they're older than
 * DISCOVERY.insightsFreshDays. Server-side only (service role key).
 */

interface InsightsRow {
  place_id: string;
  name: string;
  dishes: unknown;
  vibe: string | null;
  dietary: unknown;
  price_level: number | null;
  updated_at: string;
}

let client: SupabaseClient | null = null;

function supabase(): SupabaseClient {
  if (!client) {
    const env = getEnv();
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetchWithTimeout(String(input), init ?? {}, 5000),
      },
    });
  }
  return client;
}

function isFresh(updatedAt: string): boolean {
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  return ageMs < DISCOVERY.insightsFreshDays * 24 * 60 * 60 * 1000;
}

function rowToInsights(row: InsightsRow): Insights {
  // jsonb came from us, but it's still external state — gate it like LLM output.
  const dishes = extractionSchema.shape.dishes.parse(row.dishes);
  const dietary = extractionSchema.shape.dietary.parse(row.dietary ?? []);
  return { dishes, vibe: row.vibe, dietary };
}

async function readRow(placeId: string): Promise<InsightsRow | null> {
  const { data, error } = await supabase()
    .from("place_insights")
    .select("place_id,name,dishes,vibe,dietary,price_level,updated_at")
    .eq("place_id", placeId)
    .maybeSingle<InsightsRow>();
  if (error) {
    console.warn(`place_insights read failed for ${placeId}:`, error.message);
    return null;
  }
  return data;
}

async function upsertRow(candidate: Candidate, insights: Insights): Promise<void> {
  const { error } = await supabase().from("place_insights").upsert({
    place_id: candidate.placeId,
    name: candidate.name,
    dishes: insights.dishes,
    vibe: insights.vibe,
    // Store the union of what the reviews confirmed and what the place's own
    // name/types signal, so the badge survives even on a future cache hit.
    dietary: [...new Set([...insights.dietary, ...candidate.dietary])],
    price_level: candidate.priceLevel,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.warn(`place_insights upsert failed for ${candidate.placeId}:`, error.message);
  }
}

/**
 * Fresh row → use it (no Places Details, no Groq). Otherwise extract and
 * upsert. A failed extraction (null) is never persisted — a stale row beats
 * nothing, and nothing beats caching a transient failure for 30 days.
 * Never throws.
 */
export async function getStoredInsights(candidate: Candidate): Promise<Insights> {
  let row: InsightsRow | null = null;
  try {
    row = await readRow(candidate.placeId);
    if (row && isFresh(row.updated_at)) {
      return rowToInsights(row);
    }

    const reviews = await fetchReviews(candidate.placeId).catch((error) => {
      console.warn(`fetchReviews failed for ${candidate.placeId}:`, error);
      return null;
    });
    const extracted = reviews === null ? null : await extractDishes(candidate.name, reviews);

    if (extracted !== null) {
      await upsertRow(candidate, extracted).catch(() => {});
      return extracted;
    }
  } catch (error) {
    console.warn(`getStoredInsights failed for ${candidate.placeId}:`, error);
  }

  if (row) {
    try {
      return rowToInsights(row); // stale beats empty
    } catch {
      // fall through
    }
  }
  // No dishes, but the place's own name/types may still justify a badge.
  return { dishes: [], vibe: null, dietary: candidate.dietary };
}
