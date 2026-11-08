import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { route, json, body } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { evaluateWriting } from "@/lib/ai/evaluate";
import type { WritingConfig } from "@/lib/content-types";
export const maxDuration = 90;
/** Upgrades a brief mock-test rating into full writing feedback. */
export const POST = route(async ({ userId, req }) => {
  const { submissionId } = await body(req, z.object({ submissionId: z.string().max(40) }));
  const sub = await prisma.writingSubmission.findFirst({ where: { id: submissionId, userId }, include: { exercise: true } });
  if (!sub) return json({ error: "Submission not found." }, 404);
  const aiMode = (await prisma.userProfile.findUnique({ where: { userId }, select: { aiMode: true } }))?.aiMode;
  const evaluation = await evaluateWriting(sub.exercise.config as unknown as WritingConfig, sub.text, { forceDemo: aiMode === "demo" });
  await prisma.writingSubmission.update({ where: { id: sub.id }, data: { evaluation: evaluation as unknown as Prisma.InputJsonValue, evalMode: evaluation.mode, estimatedLevel: evaluation.level } });
  return json({ submissionId: sub.id, evaluation });
}, { ai: true });
