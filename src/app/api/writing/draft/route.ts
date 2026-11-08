import { route, json, body } from "@/lib/api";
import { writingDraftSchema } from "@/lib/validation";
import { saveDraft, getDraft } from "@/lib/services/writing";
export const PUT = route(async ({ userId, req }) => { const { exerciseId, text } = await body(req, writingDraftSchema); const d = await saveDraft(userId, exerciseId, text); return json({ savedAt: d.updatedAt }); });
export const GET = route(async ({ userId, req }) => { const id = new URL(req.url).searchParams.get("exerciseId") ?? ""; return json({ draft: id ? await getDraft(userId, id) : null }); });
