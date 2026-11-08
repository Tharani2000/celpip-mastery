import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { evaluateWriting } from "../ai/evaluate";
import { writingXp } from "../xp";
import { hashText, wordCount } from "../utils";
import type { WritingConfig } from "../content-types";
import { logActivity } from "./activity";
import { NotFoundError } from "./practice";

async function writingExercise(id: string) {
  const ex = await prisma.exercise.findUnique({ where: { id } });
  if (!ex || ex.skill !== "WRITING") throw new NotFoundError("Writing task not found");
  return { ex, cfg: ex.config as unknown as WritingConfig };
}
const forceDemo = async (userId: string) => (await prisma.userProfile.findUnique({ where: { userId }, select: { aiMode: true } }))?.aiMode === "demo";

export async function saveDraft(userId: string, exerciseId: string, text: string) {
  await writingExercise(exerciseId);
  const existing = await prisma.writingSubmission.findFirst({ where: { userId, exerciseId, status: "DRAFT" } });
  const data = { text, wordCount: wordCount(text) };
  return existing ? prisma.writingSubmission.update({ where: { id: existing.id }, data }) : prisma.writingSubmission.create({ data: { userId, exerciseId, status: "DRAFT", ...data } });
}
export async function getDraft(userId: string, exerciseId: string) {
  return prisma.writingSubmission.findFirst({ where: { userId, exerciseId, status: "DRAFT" }, select: { text: true, updatedAt: true } });
}

export async function submitWriting(userId: string, input: { exerciseId: string; text: string; durationSec: number }, opts: { fromMock?: boolean; fetcher?: typeof fetch } = {}) {
  const { ex, cfg } = await writingExercise(input.exerciseId);
  const words = wordCount(input.text); const h = hashText(input.text);
  const dup = await prisma.writingSubmission.count({ where: { userId, textHash: h, status: "EVALUATED" } });
  const evaluation = await evaluateWriting(cfg, input.text, { forceDemo: await forceDemo(userId), fetcher: opts.fetcher });
  const xp = opts.fromMock ? { xp: 0, messages: [] as string[] } : writingXp({ words, durationSec: input.durationSec, isDuplicate: dup > 0, level: evaluation.level });
  await prisma.writingSubmission.deleteMany({ where: { userId, exerciseId: ex.id, status: "DRAFT" } });
  const sub = await prisma.writingSubmission.create({ data: { userId, exerciseId: ex.id, status: "EVALUATED", text: input.text, wordCount: words, textHash: h, durationSec: Math.round(input.durationSec), estimatedLevel: evaluation.level, evaluation: evaluation as unknown as Prisma.InputJsonValue, evalMode: evaluation.mode, xpAwarded: xp.xp, fromMock: !!opts.fromMock } });
  const events = opts.fromMock ? [] : await logActivity(userId, { seconds: input.durationSec, skill: "WRITING", countsAsExercise: true, xp: [{ xp: xp.xp, reason: "Writing response" }] });
  return { submissionId: sub.id, evaluation, words, xp: xp.xp, messages: xp.messages, events };
}
