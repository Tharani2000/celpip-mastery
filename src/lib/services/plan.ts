import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { generatePlan, isDateStr, type CatalogExercise, type PlanDay, type PlanSettings, type PlanSkill } from "../plan";
import { shortType } from "../content-types";
import { sceneAlt } from "../../components/exercise/scenes";

/** Short, distinguishing description of a speaking task: the picture, or the start of the prompt. */
function speakingHint(cfg: { prompt?: string; image?: string }): string {
  const raw = cfg.image ? sceneAlt(cfg.image).replace(/^Illustration of (an? )?/i, "") : (cfg.prompt ?? "");
  const t = raw.replace(/\s+/g, " ").trim();
  const clipped = t.length > 72 ? `${t.slice(0, 70).replace(/\s+\S*$/, "")}…` : t;
  return clipped.charAt(0).toUpperCase() + clipped.slice(1);
}

export class PlanNotFoundError extends Error { status = 404; constructor() { super("Create a plan first."); } }

/** Every published exercise, shaped for the plan generator and the swap menu. */
export async function planCatalog(): Promise<CatalogExercise[]> {
  const ex = await prisma.exercise.findMany({ where: { published: true }, select: { id: true, slug: true, skill: true, part: true, difficulty: true, taskType: true, title: true, config: true } });
  return ex.map((e) => {
    const skill = e.skill.toLowerCase() as PlanSkill;
    const group = (e.config as { task?: number } | null)?.task ?? e.part;
    const where = skill === "writing" || skill === "speaking" ? `Task ${group}` : `Part ${group}`;
    const hint = skill === "speaking" ? speakingHint((e.config ?? {}) as { prompt?: string; image?: string }) : e.title;
    return { id: e.id, skill, group, difficulty: e.difficulty, slug: e.slug, label: `${where} · ${shortType(e.taskType)}: ${hint}` };
  });
}

/** Exercise ids the learner has ever attempted (used to put new material first). */
async function attemptedIds(userId: string, since?: Date): Promise<Set<string>> {
  const where = { userId, ...(since ? { createdAt: { gte: since } } : {}) };
  const [a, w, s] = await Promise.all([
    prisma.practiceAttempt.findMany({ where, select: { exerciseId: true }, distinct: ["exerciseId"] }),
    prisma.writingSubmission.findMany({ where: { ...where, status: "EVALUATED" }, select: { exerciseId: true }, distinct: ["exerciseId"] }),
    prisma.speakingSubmission.findMany({ where, select: { exerciseId: true }, distinct: ["exerciseId"] })
  ]);
  return new Set([...a, ...w, ...s].map((x) => x.exerciseId));
}

export async function getPlanView(userId: string) {
  const [plan, catalog] = await Promise.all([prisma.studyPlan.findUnique({ where: { userId } }), planCatalog()]);
  if (!plan) return { plan: null, catalog, completed: [] as string[] };
  const completed = [...(await attemptedIds(userId, plan.startedAt))];
  return { plan: { settings: plan.settings as unknown as PlanSettings, days: plan.days as unknown as PlanDay[], startedAt: plan.startedAt.toISOString() }, catalog, completed };
}

/** Builds a fresh plan from the learner's settings. Replaces any existing plan and restarts completion tracking. */
export async function createPlan(userId: string, settings: PlanSettings) {
  if (!isDateStr(settings.startDate)) throw Object.assign(new Error("Choose a valid start date."), { status: 400 });
  const [catalog, attempted] = await Promise.all([planCatalog(), attemptedIds(userId)]);
  const days = generatePlan(catalog, settings, attempted);
  const data = { settings: settings as unknown as Prisma.InputJsonValue, days: days as unknown as Prisma.InputJsonValue, startedAt: new Date() };
  await prisma.studyPlan.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  return getPlanView(userId);
}

/** Saves the learner's hand edits to the days (swaps, removals, additions, ticks). */
export async function savePlanDays(userId: string, days: PlanDay[]) {
  const plan = await prisma.studyPlan.findUnique({ where: { userId }, select: { id: true } });
  if (!plan) throw new PlanNotFoundError();
  const ids = [...new Set(days.flatMap((d) => d.items.map((i) => i.exerciseId).filter((x): x is string => !!x)))];
  if (ids.length) {
    const found = await prisma.exercise.count({ where: { id: { in: ids }, published: true } });
    if (found !== ids.length) throw Object.assign(new Error("One of the chosen exercises no longer exists. Refresh and try again."), { status: 400 });
  }
  await prisma.studyPlan.update({ where: { userId }, data: { days: days as unknown as Prisma.InputJsonValue } });
}

export async function deletePlan(userId: string) { await prisma.studyPlan.deleteMany({ where: { userId } }); }
