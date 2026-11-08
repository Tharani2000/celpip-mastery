import { NextResponse } from "next/server";
import { ZodError, type ZodType, type ZodTypeDef } from "zod";
import { AuthError, requireUserId } from "./auth";
import { rateLimit, aiLimit } from "./rate-limit";

export const json = (data: unknown, init?: number | ResponseInit) => NextResponse.json(data, typeof init === "number" ? { status: init } : init);

/** Wraps a route handler: resolves the signed-in user, maps known errors to HTTP codes and never leaks stack traces. */
export function route<C = unknown>(fn: (ctx: { userId: string; req: Request; params: C }) => Promise<Response>, opts: { ai?: boolean } = {}) {
  return async (req: Request, context: { params: C }) => {
    try {
      const userId = await requireUserId();
      if (opts.ai) {
        const rl = rateLimit(`ai:${userId}`, aiLimit());
        if (!rl.ok) return json({ error: `Too many evaluation requests. Try again in ${rl.retryAfterSec}s.` }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
      }
      return await fn({ userId, req, params: context?.params });
    } catch (e) { return errorResponse(e); }
  };
}
export function errorResponse(e: unknown) {
  if (e instanceof AuthError) return json({ error: "Sign in to continue." }, 401);
  if (e instanceof ZodError) return json({ error: e.issues[0]?.message ?? "Invalid input.", issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, 400);
  const status = (e as { status?: number })?.status;
  if (status && status >= 400 && status < 500) return json({ error: (e as Error).message }, status);
  console.error("[api]", e);
  return json({ error: "Something went wrong on our side. Please try again." }, 500);
}
export async function body<T>(req: Request, schema: ZodType<T, ZodTypeDef, unknown>): Promise<T> {
  let raw: unknown;
  try { raw = await req.json(); } catch { throw Object.assign(new Error("Request body must be JSON."), { status: 400 }); }
  return schema.parse(raw);
}
