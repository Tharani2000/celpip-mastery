import { route, json, body } from "@/lib/api";
import { vocabQuizSchema } from "@/lib/validation";
import { recordQuiz } from "@/lib/services/vocabulary";
export const POST = route(async ({ userId, req }) => { const i = await body(req, vocabQuizSchema); return json({ events: await recordQuiz(userId, i.correct, i.total, i.durationSec) }); });
