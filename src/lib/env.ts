/**
 * Server-side env access + mock-mode detection. Keys must never reach the
 * browser: none are NEXT_PUBLIC_, so Next never inlines them client-side,
 * and the guard below makes any accidental client import fail loudly.
 */
if (typeof window !== "undefined") {
  throw new Error("src/lib/env.ts is server-only and must not be imported from client code");
}

export interface Env {
  googlePlacesApiKey: string;
  groqApiKey: string;
  groqModel: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export const REQUIRED_ENV_VARS = [
  "GOOGLE_PLACES_API_KEY",
  "GROQ_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

/** Mock mode: any required key missing → serve fixtures, show the demo banner. */
export function isMockMode(): boolean {
  return REQUIRED_ENV_VARS.some((key) => !process.env[key]?.trim());
}

/** Only call when isMockMode() is false. */
export function getEnv(): Env {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
  return {
    googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY!,
    groqApiKey: process.env.GROQ_API_KEY!,
    groqModel: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
}
