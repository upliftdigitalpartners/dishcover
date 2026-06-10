# Dishcover

Mobile-first PWA for travelers: pick a mood + budget, get 3–5 nearby restaurants with the dishes people rave about (with prices), decide in under 30 seconds. **Answer engine, not search engine** — short, confident answers, never 50 scrollable results. Informational only; not a reservation app.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript (strict) + Tailwind CSS v4 (CSS-first: no `tailwind.config` — design tokens live in `src/app/globals.css` under `@theme`)
- PWA: `src/app/manifest.ts` + hand-written `public/sw.js` (no PWA libraries)
- Google Places API (New) — `places.googleapis.com/v1` only, never the legacy API
- Groq (OpenAI-compatible, plain fetch — no SDK) for dish extraction from reviews
- Supabase Postgres for `place_insights` (permanent store, server-side only)
- zod for API input + LLM output validation
- Deploy: Vercel (serverless — no in-memory state between requests)

Dependencies are intentionally minimal: next, react, react-dom, @supabase/supabase-js, zod (+ Tailwind/ESLint dev deps). Ask before adding anything.

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build (run before every commit)
- `npm run lint` — ESLint

## Env vars (all server-side only — none may ever reach the browser; no `NEXT_PUBLIC_` prefix)

See `.env.example`. `GOOGLE_PLACES_API_KEY`, `GROQ_API_KEY`, `GROQ_MODEL` (default `llama-3.3-70b-versatile`), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

**Mock mode:** if any required key is missing at runtime, the app serves ~8 fixture restaurants from `src/lib/fixtures.ts` and shows a "demo data" banner. The full UI must always work with zero keys. Mock-mode detection lives in `src/lib/env.ts`.

## Architecture

One screen (`src/app/page.tsx`) → `POST /api/discover` → pipeline in `src/lib/discover.ts`:
Nearby Search (≤20 candidates) → mood/budget/rating/dietary filter + weighted ranking (`src/lib/rank.ts`, config in `src/lib/config.ts`) → top 5 → per-place: Supabase `place_insights` read-through (fresh < 30 days) else Place Details (reviews) + Groq extraction + upsert → 3–5 cards.

- **Dietary needs** (halal/kosher/vegetarian/vegan, optional multi-select) are in scope. When any are set, real-mode discovery uses Text Search (`searchDietary`, query carries the dietary terms — Google's relevance matches them from listings + reviews) instead of Nearby Search; `rank.ts` then hard-filters so every shown card carries every requested need. Per-place dietary signals come from name/type detection (`detectDietary`) + Groq (`dietary` field, only when reviews explicitly confirm — never inferred from cuisine). Config lives in the `DIETARY` object in `src/lib/config.ts`.
- Mood mapping + ranking weights + known-chain exclusion list + dietary config: **one exported config object** in `src/lib/config.ts` — tweak there, nowhere else.
- All external fetches go through `fetchWithTimeout` (`src/lib/http.ts`); a failed dish extraction must never fail the whole response — degrade to a card without "Order this".
- Per-place work runs in `Promise.all`; fewer than 3 results → auto-widen radius once and label it.

## Places API (New) conventions (verified June 2026)

- Nearby Search: `POST /v1/places:searchNearby`. **No `openNow` request filter exists** — request `places.currentOpeningHours` in the field mask and post-filter on `currentOpeningHours.openNow`.
- `currentOpeningHours.nextCloseTime` (ISO timestamp) powers the "Closes in ~X min" / "Until 10 PM" labels — it rides along in the field we already pay for; no SKU change.
- Field masks: `X-Goog-FieldMask` header, comma-separated, **no spaces**. Search endpoints prefix fields with `places.`; Place Details uses bare names. Never use `*`.
- Search mask (Enterprise SKU — do not add fields casually, `reviews` in a search mask is money on fire): `places.id,places.displayName,places.location,places.types,places.primaryType,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours`
- Reviews come only from `GET /v1/places/{id}` (max 5 returned; text at `reviews[].text.text`), only for top-5 cache misses.
- `displayName` is a LocalizedText object — the string is `displayName.text`.
- `priceLevel` is a string enum (`PRICE_LEVEL_INEXPENSIVE`…`PRICE_LEVEL_VERY_EXPENSIVE`), mapped to budget 1–4. Not legacy integers.
- Text Search (`POST /v1/places:searchText`, mask `places.location`) geocodes the "Where are you?" fallback.

## Groq conventions

- `POST https://api.groq.com/openai/v1/chat/completions`, `response_format: {type: "json_object"}` (the word "JSON" must appear in the prompt), `temperature: 0`.
- `json_schema`/structured outputs are NOT supported on llama-3.3-70b-versatile — json_object + zod validation is the contract. On parse/validation failure return empty dishes; never throw upward.
- `src/lib/extract.ts` is provider-agnostic: swapping providers = base URL + key + model, one file.

## Supabase conventions

- `place_insights` is a **permanent, growing dataset (the moat)** — never delete rows, only refresh stale ones (>30 days). Access only from server code via service role key. Columns include a `dietary` jsonb array.
- Migrations live in `supabase/migrations/` (`001` base table, `002` dietary column); the user runs them manually in the Supabase SQL editor — never attempt to run them. Missing table/column degrades gracefully (re-extract each time, no caching) — it never throws.

## Scope guardrails (v1 — flag before building if asked)

NO: accounts/auth, reservations, saved favorites, embedded maps, review browsing, social features, multi-language, admin panel. Result count is 3–5, never more. (Dietary filtering IS in scope.)

## Quality bar

- Never a blank screen: skeletons → results | empty state | readable error.
- Every external call: timeout + fallback.
- Accessible basics: semantic HTML, labeled controls, ≥44px touch targets, sufficient contrast.
- Lighthouse's PWA category no longer exists (removed v12) — installability target is Chrome's criteria, checked in DevTools → Application → Manifest.
