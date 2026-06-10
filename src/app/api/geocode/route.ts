import { geocode } from "@/lib/discover";
import { geocodeRequestSchema } from "@/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = geocodeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Tell us a place name or address" }, { status: 400 });
  }

  try {
    const result = await geocode(parsed.data.query);
    return Response.json(result);
  } catch (error) {
    console.error("geocode failed", error);
    return Response.json(
      { error: "Couldn't find that place — try a nearby landmark or address." },
      { status: 500 },
    );
  }
}
