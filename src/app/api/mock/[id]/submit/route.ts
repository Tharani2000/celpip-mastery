import { route, json, body } from "@/lib/api";
import { mockSubmitSchema } from "@/lib/validation";
import { submitMock } from "@/lib/services/mock";
export const maxDuration = 120;
export const POST = route<{ id: string }>(async ({ userId, req, params }) => { const { items } = await body(req, mockSubmitSchema); const r = await submitMock(userId, params.id, items); return json({ attemptId: r.attempt.id, events: r.events }); }, { ai: true });
