# Dishcover 🍽️

A mobile-first PWA for travelers standing hungry in an unfamiliar city. Pick a **mood** and a **budget** — get **3–5 nearby restaurants** with the **dishes people actually rave about, with prices** — and decide in under 30 seconds.

Answer engine, not search engine: Dishcover reads the reviews so you don't have to. Under each restaurant it shows *"Order this: birria tacos ($9) · pad thai ($12)"*, extracted from real review text.

Optional **dietary filters** — Halal, Kosher, Vegetarian, Vegan — narrow results to places that meet the need (matched via Google's listing + review relevance) and each match shows a trust badge.

## Try it with zero keys

The app runs in **mock mode** out of the box — no API keys needed. It serves ~8 realistic fixture restaurants with a "demo data" banner so you can exercise the entire UI.

```bash
npm install
npm run dev
```

Open http://localhost:3000, allow (or deny) location, pick a mood, hit **Find food**.

## Real-data setup

Copy the env template and fill in keys as you create them — the app automatically leaves mock mode once **all** required keys are present:

```bash
cp .env.example .env.local
```

### 1. Google Places API (New)

1. In [Google Cloud Console](https://console.cloud.google.com/), create (or pick) a project with billing enabled.
2. **APIs & Services → Library →** enable **“Places API (New)”** — the one labeled *(New)*; the legacy "Places API" will not work.
3. **APIs & Services → Credentials → Create credentials → API key.** Restrict the key to the Places API (New).
4. Put it in `.env.local` as `GOOGLE_PLACES_API_KEY`.

Cost notes: the app uses tight field masks (Nearby Search bills Enterprise, ~$35/1k; review fetches happen only for top-5 places missing from the insights store, ~$25/1k) and Google's free monthly call allowances cover light use.

### 2. Groq

1. Create a key at [console.groq.com](https://console.groq.com/) → API Keys.
2. Set `GROQ_API_KEY`. Leave `GROQ_MODEL=llama-3.3-70b-versatile` (free tier: ~1,000 requests/day — plenty, since each restaurant is extracted at most once per 30 days thanks to the insights store).

### 3. Supabase

1. Create a project at [supabase.com](https://supabase.com/).
2. **SQL Editor →** run both migrations in order: [001_place_insights.sql](supabase/migrations/001_place_insights.sql) then [002_place_insights_dietary.sql](supabase/migrations/002_place_insights_dietary.sql). (Until they're run, the app still works — it just re-extracts every time instead of caching.)
3. **Settings → API:** copy the **Project URL** into `SUPABASE_URL` and the **service_role** key (not the anon key) into `SUPABASE_SERVICE_ROLE_KEY`.

All keys are server-side only and never reach the browser.

## Local development

```bash
npm run dev     # dev server (service worker disabled in dev)
npm run build   # production build + type check
npm run start   # serve the production build (service worker active)
npm run lint    # ESLint
```

## Deploy to Vercel

1. Push the repo to GitHub and import it in Vercel (defaults are fine — Next.js is auto-detected).
2. **Project → Settings → Environment Variables:** add `GOOGLE_PLACES_API_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` for Production (and Preview if you want real data there). Missing keys = mock mode, deliberately.
3. Deploy. No `maxDuration` config is needed — the discover route finishes in a few seconds and Vercel's default function duration is generous.

## Manual test checklist (on your phone)

1. **Install prompt:** open the deployed URL in Chrome (Android) → ⋮ → *Add to Home screen* shows the Dishcover icon; on iOS Safari → Share → *Add to Home Screen*. Launching from the icon opens standalone (no browser chrome).
2. **Location flow:** allow location → "Your location" appears. Then in a private tab, deny it → the "Where are you?" text input appears; type a neighborhood and Set.
3. **Happy path:** pick *Local & authentic* + `$$` → **Find food** → skeleton cards, then 3–5 results, each with rating, price level, walk time, a closing time ("Until 11 PM", or an amber "Closes in ~35 min" when it's tight), an "Order this" line with prices, a why-line, a **Share** button (native share sheet), and a working **Directions** link into Google Maps.
4. **Dietary filter:** select *Halal* (and/or Kosher/Vegetarian/Vegan) → results narrow to matching places, each with a green dietary badge. Deselect to broaden again.
5. **Just pick one:** tap it → exactly one highlighted card with *Show me others* underneath.
6. **Auto-widen:** pick *Treat yourself* + `$$$$` on the 10-min walk setting → expect the "Widened search to a 25-min walk" notice.
7. **Empty state:** pick a contradictory combo (*Treat yourself* + `$`) → friendly "Nothing open matches" message, no blank screen.
8. **Offline:** turn on airplane mode, relaunch from the home-screen icon → the "You're offline" page appears (production/deployed only).
9. **Mock banner:** if any key is missing, every result set carries the "Demo data" banner.
10. **Idle suggestions:** before the first search, the "No idea what you want?" presets appear — tapping one fills the form and searches in one go.
11. **Install nudge:** after results, a dismissible "Keep Dishcover in your pocket" hint appears (Install button on Android/Chrome; Share → Add to Home Screen steps on iOS). Dismissing it sticks.
