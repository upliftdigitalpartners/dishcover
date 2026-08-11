import { describeApiFailure } from "@/lib/apiError";
import { discover } from "@/lib/discover";
import { discoverRequestSchema } from "@/lib/schemas";

/**
 * Real-mode discovery is a search plus up to five review fetches and LLM
 * extractions. That fits comfortably in 30s but not in the 10s a serverless
 * platform gives a function by default — and a gateway timeout would surface
 * as an unexplained failure with no JSON body for the client to read.
 */
export const maxDuration = 30;

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = discoverRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await discover(parsed.data);
    return Response.json(result);
  } catch (error) {
    console.error("discover failed", error);
    const failure = describeApiFailure(error, "Couldn't search right now — please try again.");
    return Response.json(failure.body, { status: failure.status });
  }
}
