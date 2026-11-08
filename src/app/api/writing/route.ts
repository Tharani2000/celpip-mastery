import { route, json, body } from "@/lib/api";
import { writingSubmitSchema } from "@/lib/validation";
import { submitWriting } from "@/lib/services/writing";
import { wordCount } from "@/lib/utils";
export const maxDuration = 90;
export const POST = route(async ({ userId, req }) => {
  const input = await body(req, writingSubmitSchema);
  if (wordCount(input.text) < 10) return json({ error: "Write at least 10 words before submitting." }, 400);
  return json(await submitWriting(userId, input), 201);
}, { ai: true });
