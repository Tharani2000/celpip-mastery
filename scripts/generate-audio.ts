/**
 * Optional: pre-generates MP3 audio for every listening exercise using OpenAI's text-to-speech API,
 * so the app can play real recordings instead of falling back to the browser's speech engine.
 *
 * Requires OPENAI_API_KEY. Writes files to public/audio/<slug>.mp3 and stores the public URL on each
 * Exercise's audioUrl column. Safe to re-run: it skips exercises that already have an audioUrl unless
 * --force is passed. If OPENAI_API_KEY is not set, the script exits without changing anything and the
 * app continues to use the browser's speech synthesis for listening audio.
 *
 * Usage:
 *   npm run audio:generate          # generate missing audio only
 *   npm run audio:generate -- --force
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { ListeningScript } from "../src/lib/content-types";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const OUT_DIR = path.resolve("public/audio");
const VOICES = { m: "onyx", f: "nova", f2: "shimmer" } as const;

async function synthesizeLine(apiKey: string, text: string, voice: string): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "tts-1", voice, input: text, response_format: "mp3" })
  });
  if (!res.ok) throw new Error(`TTS request failed (${res.status}): ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Concatenating raw MP3 frames works well enough for speech-only clips without needing ffmpeg. */
async function synthesizeScript(apiKey: string, script: ListeningScript): Promise<Buffer> {
  const parts: Buffer[] = [];
  for (const [speakerKey, text] of script.lines) {
    const voice = VOICES[script.speakers[speakerKey]?.voice ?? "f"] ?? "alloy";
    parts.push(await synthesizeLine(apiKey, text, voice));
    await new Promise((r) => setTimeout(r, 150)); // stay well under rate limits
  }
  return Buffer.concat(parts);
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { console.log("OPENAI_API_KEY is not set. Skipping audio generation; the app will use browser speech synthesis instead."); return; }
  const force = process.argv.includes("--force");
  await mkdir(OUT_DIR, { recursive: true });
  const exercises = await prisma.exercise.findMany({ where: { skill: "LISTENING" }, orderBy: { part: "asc" } });
  let made = 0;
  for (const ex of exercises) {
    if (ex.audioUrl && !force) { console.log(`Skipping ${ex.slug} (already has audio; pass --force to regenerate)`); continue; }
    console.log(`Generating audio for ${ex.slug}: ${ex.title}...`);
    const buf = await synthesizeScript(apiKey, ex.script as unknown as ListeningScript);
    const file = `${ex.slug}.mp3`;
    await writeFile(path.join(OUT_DIR, file), buf);
    await prisma.exercise.update({ where: { id: ex.id }, data: { audioUrl: `/audio/${file}` } });
    made++;
  }
  console.log(`Done. Generated ${made} audio file(s) in ${OUT_DIR}.`);
}
main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
