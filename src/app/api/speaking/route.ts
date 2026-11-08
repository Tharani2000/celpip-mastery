import { route, json } from "@/lib/api";
import { speakingFieldsSchema } from "@/lib/validation";
import { submitSpeaking } from "@/lib/services/speaking";
export const maxDuration = 120;
/** Multipart: audio (optional Blob), exerciseId, transcript, transcriptSource, durationSec, mock ("1" to store without evaluating). */
export const POST = route(async ({ userId, req }) => {
  const form = await req.formData();
  const fields = speakingFieldsSchema.parse({ exerciseId: form.get("exerciseId"), transcript: form.get("transcript") ?? "", transcriptSource: form.get("transcriptSource") ?? "browser", durationSec: form.get("durationSec") });
  const audio = form.get("audio");
  const fromMock = form.get("mock") === "1";
  return json(await submitSpeaking(userId, { ...fields, audio: audio instanceof File ? audio : null }, { fromMock, evaluate: !fromMock }), 201);
}, { ai: true });
