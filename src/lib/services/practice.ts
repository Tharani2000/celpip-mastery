import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { scoreAnswers } from "../scoring";
import { objectiveXp } from "../xp";
import { activityDate, dateKey } from "../utils";
import { logActivity, userTimezone, type XpEvent } from "./activity";
import { loadScorable } from "./content";

export class NotFoundError extends Error { status = 404; }

export async function submitPractice(userId: string, input: { exerciseId: string; answers: Record<string, string | null>; durationSec: number }, opts: { fromMock?: boolean; skipActivity?: boolean } = {}) {
  const ex = await loadScorable(input.exerciseId);
  if (!ex || (ex.skill !== "LISTENING" && ex.skill !== "READING")) throw new NotFoundError("Exercise not found");
  const result = scoreAnswers(ex.questions, input.answers);
  const tz = await userTimezone(userId);
  const prev = await prisma.practiceAttempt.findMany({ where: { userId, exerciseId: ex.id }, select: { percent: true, createdAt: true } });
  const today = dateKey(activityDate(new Date(), tz));
  const xp = objectiveXp({ percent: result.percent, durationSec: input.durationSec, total: result.total, previousPercents: prev.map((p) => p.percent), todayPercents: prev.filter((p) => dateKey(activityDate(p.createdAt, tz)) === today).map((p) => p.percent), fromMock: opts.fromMock });
  const attempt = await prisma.practiceAttempt.create({ data: { userId, exerciseId: ex.id, skill: ex.skill, taskType: ex.taskType, correct: result.correct, total: result.total, percent: result.percent, estimatedLevel: result.level, durationSec: Math.round(input.durationSec), xpAwarded: xp.xp, answers: result.answers as Prisma.InputJsonValue, categories: result.categories as unknown as Prisma.InputJsonValue, fromMock: !!opts.fromMock } });
  let events: XpEvent[] = [];
  if (!opts.skipActivity) events = await logActivity(userId, { seconds: input.durationSec, skill: ex.skill, countsAsExercise: true, xp: [{ xp: xp.xp, reason: `${ex.skill === "LISTENING" ? "Listening" : "Reading"} exercise` }] });
  return { attemptId: attempt.id, correct: result.correct, total: result.total, percent: result.percent, level: result.level, categories: result.categories, review: result.review, xp: xp.xp, messages: xp.messages, events };
}
