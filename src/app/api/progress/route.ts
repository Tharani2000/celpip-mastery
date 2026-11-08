import { route, json } from "@/lib/api";
import { resetProgress } from "@/lib/services/profile";
export const DELETE = route(async ({ userId }) => { await resetProgress(userId); return json({ ok: true }); });
