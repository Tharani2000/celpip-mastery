/** Server-side speech-to-text through OpenAI's transcription API. Returns null when not configured or on failure,
 *  in which case the learner-reviewed browser transcript is used instead. */
export async function transcribeAudio(file: Blob, filename: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const form = new FormData();
  form.append("file", file, filename);
  form.append("model", process.env.TRANSCRIPTION_MODEL || "whisper-1");
  form.append("language", "en");
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 60_000);
  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { authorization: `Bearer ${key}` }, body: form, signal: ctl.signal });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.text === "string" && data.text.trim() ? data.text.trim() : null;
  } catch { return null; } finally { clearTimeout(t); }
}
export const serverTranscriptionAvailable = () => !!process.env.OPENAI_API_KEY;
