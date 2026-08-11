import { pingGroq } from "@/lib/extract";
import { isMockMode, REQUIRED_ENV_VARS } from "@/lib/env";
import { pingStore } from "@/lib/insights";
import { pingPlaces, PlacesError } from "@/lib/places";

/**
 * Diagnostics for the three external dependencies. When search fails in real
 * mode the reason lives in a server log the operator can't read from a phone —
 * this endpoint puts it in front of them: which keys are set (booleans only,
 * never values), and what each provider says when actually called.
 *
 * The Places probe uses an ID-only field mask and Groq's is a model lookup, so
 * checking costs nothing beyond a round trip.
 */
export const dynamic = "force-dynamic";

interface Check {
  ok: boolean;
  /** Why it failed, in the provider's own words. */
  detail?: string;
  /** For Places: which kind of failure, matching the `reason` from /api/discover. */
  kind?: string;
  status?: number | null;
}

async function check(probe: () => Promise<void>): Promise<Check> {
  try {
    await probe();
    return { ok: true };
  } catch (error) {
    if (error instanceof PlacesError) {
      return { ok: false, kind: error.kind, status: error.status, detail: error.detail };
    }
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

export async function GET(): Promise<Response> {
  const env = Object.fromEntries(
    REQUIRED_ENV_VARS.map((key) => [key, Boolean(process.env[key]?.trim())]),
  );

  if (isMockMode()) {
    return Response.json({
      mode: "mock",
      note: "Serving fixture data — set every env var below to search real restaurants.",
      env,
    });
  }

  const [places, groq, supabase] = await Promise.all([
    check(pingPlaces),
    check(pingGroq),
    check(pingStore),
  ]);

  // Only Places can fail the search outright; Groq and Supabase degrade to
  // cards without dishes, so they don't decide overall health.
  return Response.json(
    { mode: "live", ok: places.ok, env, checks: { places, groq, supabase } },
    { status: places.ok ? 200 : 503 },
  );
}
