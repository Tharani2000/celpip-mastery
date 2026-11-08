import { registerSchema } from "@/lib/validation";
import { createUser } from "@/lib/services/profile";
import { json, errorResponse, body } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`register:${ip}`, 10, 3600_000).ok) return json({ error: "Too many sign-up attempts. Try again later." }, 429);
    const input = await body(req, registerSchema);
    const user = await createUser(input);
    return json({ user }, 201);
  } catch (e) { return errorResponse(e); }
}
