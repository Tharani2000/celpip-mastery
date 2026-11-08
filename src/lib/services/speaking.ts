import type { Prisma } from "@prisma/client";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../prisma";
import { evaluateSpeaking } from "../ai/evaluate";
import { transcribeAudio } from "../ai/transcribe";
import { speakingXp } from "../xp";
import { hashText, wordCount } from "../utils";
import type { SpeakingConfig } from "../content-types";
import { logActivity } from "./activity";
import { NotFoundError } from "./practice";

const ALLOWED = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav"];
export class ValidationError extends Error { status = 400; }
const storageDir = () => path.resolve(process.env.AUDIO_STORAGE_DIR || "./storage/audio");

export async function storeAudio(userId: string, file: File): Promise<{ audioPath: string; mime: string }> {
  const mime = (file.type || "").split(";")[0];
  if (!ALLOWED.includes(mime)) throw new ValidationError("Unsupported audio format.");
  const max = Number(process.env.MAX_AUDIO_MB || 15) * 1024 * 1024;
  if (file.size > max) throw new ValidationError("Recording is too large.");
  const ext = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : mime.includes("mpeg") ? "mp3" : mime.includes("wav") ? "wav" : "webm";
  const dir = path.join(storageDir(), userId.replace(/[^a-z0-9]/gi, ""));
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { audioPath: path.join(path.basename(dir), name), mime };
}
export async function readAudio(userId: string, submissionId: string) {
  const s = await prisma.speakingSubmission.findFirst({ where: { id: submissionId, userId } });
  if (!s?.audioPath) return null;
  const full = path.join(storageDir(), s.audioPath);
  if (!full.startsWith(storageDir())) return null;
  return { data: await readFile(full), mime: s.audioMime || "audio/webm" };
}

export async function submitSpeaking(userId: string, input: { exerciseId: string; transcript: string; transcriptSource: "browser" | "typed"; durationSec: number; audio?: File | null }, opts: { fromMock?: boolean; evaluate?: boolean; fetcher?: typeof fetch } = {}) {
  const ex = await prisma.exercise.findUnique({ where: { id: input.exerciseId } });
  if (!ex || ex.skill !== "SPEAKING") throw new NotFoundError("Speaking task not found");
  const cfg = ex.config as unknown as SpeakingConfig;
  let stored: { audioPath: string; mime: string } | null = null; let transcript = input.transcript.trim(); let source: string = input.transcriptSource;
  if (input.audio && input.audio.size > 0) {
    stored = await storeAudio(userId, input.audio);
    const server = await transcribeAudio(input.audio, path.basename(stored.audioPath));
    if (server) { transcript = server; source = "server"; }
  }
  const evaluateNow = opts.evaluate ?? !opts.fromMock;
  if (evaluateNow && wordCount(transcript) < 15) throw new ValidationError("The transcript needs at least 15 words to evaluate.");
  const h = hashText(transcript);
  const dup = transcript ? await prisma.speakingSubmission.count({ where: { userId, transcriptHash: h } }) : 0;
  const aiMode = (await prisma.userProfile.findUnique({ where: { userId }, select: { aiMode: true } }))?.aiMode;
  const evaluation = evaluateNow ? await evaluateSpeaking(cfg, transcript, input.durationSec, { forceDemo: aiMode === "demo", fetcher: opts.fetcher }) : null;
  const xp = evaluation && !opts.fromMock ? speakingXp({ words: wordCount(transcript), durationSec: input.durationSec, speakSeconds: cfg.speak, isDuplicate: dup > 0, level: evaluation.level }) : { xp: 0, messages: [] as string[] };
  const sub = await prisma.speakingSubmission.create({ data: { userId, exerciseId: ex.id, status: evaluation ? "EVALUATED" : "SUBMITTED", audioPath: stored?.audioPath, audioMime: stored?.mime, durationSec: Math.round(input.durationSec), transcript, transcriptSource: source, transcriptHash: h, estimatedLevel: evaluation?.level, evaluation: (evaluation ?? undefined) as unknown as Prisma.InputJsonValue | undefined, evalMode: evaluation?.mode, xpAwarded: xp.xp, fromMock: !!opts.fromMock } });
  const events = opts.fromMock ? [] : await logActivity(userId, { seconds: cfg.prep + input.durationSec + 30, skill: "SPEAKING", countsAsExercise: true, xp: [{ xp: xp.xp, reason: "Speaking task" }] });
  return { submissionId: sub.id, transcript, transcriptSource: source, evaluation, xp: xp.xp, messages: xp.messages, events, hasAudio: !!stored };
}
