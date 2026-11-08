import { route, json, body } from "@/lib/api";
import { mockStartSchema } from "@/lib/validation";
import { startMock } from "@/lib/services/mock";
export const POST = route(async ({ userId, req }) => { const a = await startMock(userId, await body(req, mockStartSchema)); return json({ attemptId: a.id }, 201); });
