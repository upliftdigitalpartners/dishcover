import { discover } from "@/lib/discover";
import { discoverRequestSchema } from "@/lib/schemas";

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
    return Response.json(
      { error: "Couldn't search right now — please try again." },
      { status: 500 },
    );
  }
}
