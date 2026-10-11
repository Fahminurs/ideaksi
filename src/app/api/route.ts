// Satu pintu API: POST {"action": "...", "token": "...", ...}. Logikanya di src/server/api.ts.
import { handle } from "@/server/api";

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(await request.text());
  } catch {}
  return Response.json(await handle(body));
}
