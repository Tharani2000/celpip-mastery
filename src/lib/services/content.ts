import { prisma } from "../prisma";
import type { PublicQuestion } from "../content-types";
import type { Skill } from "@prisma/client";

export async function listExercises(skill: Skill, userId: string) {
  const [exercises, best, counts] = await Promise.all([
    prisma.exercise.findMany({ where: { skill, published: true }, orderBy: [{ part: "asc" }, { slug: "asc" }], include: { _count: { select: { questions: true } } } }),
    prisma.practiceAttempt.groupBy({ by: ["exerciseId"], where: { userId, skill }, _max: { percent: true } }),
    skill === "WRITING" ? prisma.writingSubmission.groupBy({ by: ["exerciseId"], where: { userId, status: "EVALUATED" }, _max: { estimatedLevel: true } })
      : skill === "SPEAKING" ? prisma.speakingSubmission.groupBy({ by: ["exerciseId"], where: { userId }, _max: { estimatedLevel: true } }) : Promise.resolve([])
  ]);
  const bestMap = new Map(best.map((b) => [b.exerciseId, b._max.percent]));
  const lvlMap = new Map((counts as { exerciseId: string; _max: { estimatedLevel: number | null } }[]).map((c) => [c.exerciseId, c._max.estimatedLevel]));
  return exercises.map((e) => ({ id: e.id, slug: e.slug, part: e.part, title: e.title, taskType: e.taskType, context: e.context, difficulty: e.difficulty, timeLimitSec: e.timeLimitSec, maxPlays: e.maxPlays, questionCount: e._count.questions, config: e.config, bestPercent: bestMap.get(e.id) ?? null, bestLevel: lvlMap.get(e.id) ?? null, passage: e.passage }));
}

/** Exercise content safe for the browser: correct answers and explanations are stripped. */
export async function getPublicExercise(idOrSlug: string) {
  const e = await prisma.exercise.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], published: true }, include: { questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } } } });
  if (!e) return null;
  const questions: PublicQuestion[] = e.questions.map((q) => ({ id: q.id, order: q.order, text: q.text, category: q.category, options: q.options.map((o) => ({ id: o.id, label: o.label, text: o.text })) }));
  return { id: e.id, slug: e.slug, skill: e.skill, taskType: e.taskType, part: e.part, title: e.title, context: e.context, difficulty: e.difficulty, timeLimitSec: e.timeLimitSec, maxPlays: e.maxPlays, script: e.script, passage: e.passage, config: e.config, audioUrl: e.audioUrl, questions };
}
export type PublicExercise = NonNullable<Awaited<ReturnType<typeof getPublicExercise>>>;

export async function loadScorable(exerciseId: string) {
  return prisma.exercise.findUnique({ where: { id: exerciseId }, include: { questions: { include: { options: true } } } });
}
