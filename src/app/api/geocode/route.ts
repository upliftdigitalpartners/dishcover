import { describeApiFailure } from "@/lib/apiError";
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
    if (result === null) {
      // The lookup worked; the query just didn't match anywhere.
      return Response.json(
        { error: "Couldn't find that place — try a nearby landmark or address.", reason: "no_match" },
        { status: 404 },
      );
    }
    return Response.json(result);
  } catch (error) {
    console.error("geocode failed", error);
    const failure = describeApiFailure(
      error,
      "Couldn't look that up right now — please try again.",
    );
    return Response.json(failure.body, { status: failure.status });
  }
}
