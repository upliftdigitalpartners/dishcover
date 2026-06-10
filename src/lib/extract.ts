import { getEnv } from "./env";
import { fetchWithTimeout } from "./http";
import { extractionSchema } from "./schemas";
import type { Insights } from "./types";

/**
 * Dish extraction from review text via an OpenAI-compatible chat completions
 * API (Groq today). Provider-agnostic on purpose: swapping providers means
 * changing BASE_URL + key + model here and nowhere else.
 *
 * Contract: NEVER throws. Any failure — HTTP, timeout, rate limit, JSON parse,
 * schema validation — degrades to { dishes: [], vibe: null } so a card simply
 * renders without an "Order this" section.
 */

const BASE_URL = "https://api.groq.com/openai/v1";
const EXTRACTION_TIMEOUT_MS = 12_000;
const MAX_REVIEW_CHARS = 900; // per review; Places returns at most 5

// json_object mode guarantees valid JSON, not a valid shape (and Groq requires
// the word JSON in the prompt). The zod schema in schemas.ts is the real gate.
const SYSTEM_PROMPT = `You extract dish intelligence from restaurant reviews. Respond with nothing but a single JSON object — no prose, no markdown.

The JSON object must have exactly this shape:
{"dishes": [{"name": string, "price": number | null, "mentions": number}], "vibe": string | null}

Rules:
- "dishes": specific dishes or drinks reviewers genuinely praise, best first, at most 5. Skip generic mentions ("the food", "everything").
- "price": the price a reviewer states for that dish, as a plain number without currency symbols; null if no price is mentioned.
- "mentions": how many of the provided reviews mention the dish (an integer, at least 1).
- "vibe": one short lowercase phrase (under 90 characters) capturing the place's character, e.g. "beloved hole-in-the-wall for hand-pulled noodles"; null if the reviews don't make it clear.
- If no specific dishes are praised, return {"dishes": [], "vibe": ...}.`;

export async function extractDishes(
  restaurantName: string,
  reviews: string[],
): Promise<Insights> {
  const usable = reviews.map((r) => r.trim()).filter(Boolean);
  if (usable.length === 0) {
    return { dishes: [], vibe: null };
  }

  const reviewBlock = usable
    .map((review, i) => `Review ${i + 1}: ${review.slice(0, MAX_REVIEW_CHARS)}`)
    .join("\n\n");

  try {
    const env = getEnv();
    const response = await fetchWithTimeout(
      `${BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.groqApiKey}`,
        },
        body: JSON.stringify({
          model: env.groqModel,
          temperature: 0,
          max_tokens: 600,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Restaurant: ${restaurantName}\n\n${reviewBlock}\n\nReturn the JSON object.`,
            },
          ],
        }),
      },
      EXTRACTION_TIMEOUT_MS,
    );

    if (!response.ok) {
      console.warn(`extractDishes: ${restaurantName} → HTTP ${response.status}`);
      return { dishes: [], vibe: null };
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { dishes: [], vibe: null };
    }

    const parsed = extractionSchema.parse(JSON.parse(content));

    // Don't trust the model's ordering or uniqueness.
    const seen = new Set<string>();
    const dishes = parsed.dishes
      .filter((dish) => {
        const key = dish.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 5);

    return { dishes, vibe: parsed.vibe };
  } catch (error) {
    console.warn(`extractDishes: ${restaurantName} →`, error);
    return { dishes: [], vibe: null };
  }
}
