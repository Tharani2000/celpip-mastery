import { route, json, body } from "@/lib/api";
import { wordChallengeSchema } from "@/lib/validation";
import { wordChallenge } from "@/lib/services/vocabulary";
export const POST = route(async ({ userId, req }) => { const i = await body(req, wordChallengeSchema); return json(await wordChallenge(userId, i.wordId, i.sentence)); }, { ai: true });
