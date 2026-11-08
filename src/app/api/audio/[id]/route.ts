import { route, json } from "@/lib/api";
import { readAudio } from "@/lib/services/speaking";
export const GET = route<{ id: string }>(async ({ userId, params }) => {
  const a = await readAudio(userId, params.id);
  if (!a) return json({ error: "Recording not found." }, 404);
  return new Response(new Uint8Array(a.data), { headers: { "content-type": a.mime, "cache-control": "private, max-age=3600" } });
});
