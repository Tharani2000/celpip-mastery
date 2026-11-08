import { route, json, body } from "@/lib/api";
import { vocabReviewSchema } from "@/lib/validation";
import { vocabularyDeck, reviewWord } from "@/lib/services/vocabulary";
export const GET = route(async ({ userId }) => json({ words: await vocabularyDeck(userId) }));
export const POST = route(async ({ userId, req }) => { const i = await body(req, vocabReviewSchema); return json(await reviewWord(userId, i.wordId, i.grade, i.secondsOnCard)); });
