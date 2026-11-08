import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../prisma";
import { activityDate, dateKey } from "../utils";
import { computeStreak, bestStreak, BADGES, newlyEarned, challengeFor, challengeStatus, type BadgeContext, type ChallengeDef } from "../gamification";
import { streakXp, XP } from "../xp";
import content from "../../../prisma/content.json";

export type XpEvent = { xp: number; reason: string };
export const CHALLENGES = content.challenges as ChallengeDef[];
type Db = PrismaClient | Prisma.TransactionClient;

export async function userTimezone(userId: string, db: Db = prisma) {
  return (await db.userProfile.findUnique({ where: { userId }, select: { timezone: true } }))?.timezone ?? "America/Toronto";
}
export async function activeGoal(userId: string, db: Db = prisma) {
  return db.learningGoal.findFirst({ where: { userId, active: true }, orderBy: { createdAt: "desc" } });
}

/** Records practice time and XP for today, then applies streak, daily-challenge and badge rewards.
 *  Returns every XP event so the UI can show what was earned and why. */
export async function logActivity(userId: string, opts: { seconds: number; skill?: string; countsAsExercise?: boolean; xp?: XpEvent[]; vocabReviews?: number; vocabXp?: number; quiz?: boolean; wordChallenge?: boolean }): Promise<XpEvent[]> {
  const tz = await userTimezone(userId);
  const date = activityDate(new Date(), tz);
  const events: XpEvent[] = (opts.xp ?? []).filter((e) => e.xp > 0);
  const existing = await prisma.dailyActivity.findUnique({ where: { userId_date: { userId, date } } });
  const skills = new Set(existing?.skills ?? []);
  if (opts.skill && opts.skill !== "vocabulary") skills.add(opts.skill.toUpperCase());
  let day = await prisma.dailyActivity.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, seconds: Math.round(opts.seconds), exercises: opts.countsAsExercise ? 1 : 0, skills: [...skills], vocabReviews: opts.vocabReviews ?? 0, vocabXp: opts.vocabXp ?? 0, quizzes: opts.quiz ? 1 : 0, wordChallengeDone: !!opts.wordChallenge },
    update: { seconds: { increment: Math.round(opts.seconds) }, exercises: { increment: opts.countsAsExercise ? 1 : 0 }, skills: [...skills], vocabReviews: { increment: opts.vocabReviews ?? 0 }, vocabXp: { increment: opts.vocabXp ?? 0 }, quizzes: { increment: opts.quiz ? 1 : 0 }, ...(opts.wordChallenge ? { wordChallengeDone: true } : {}) }
  });
  const active = await prisma.dailyActivity.findMany({ where: { userId, OR: [{ exercises: { gt: 0 } }, { vocabReviews: { gt: 0 } }] }, select: { date: true } });
  if (!day.streakXpAwarded && (day.exercises > 0 || day.vocabReviews > 0)) {
    const s = computeStreak(active.map((a) => a.date), date);
    const x = streakXp(s); if (x) events.push({ xp: x, reason: `${s}-day streak` });
    day = await prisma.dailyActivity.update({ where: { id: day.id }, data: { streakXpAwarded: true } });
  }
  if (!day.challengeCompleted) {
    const ch = challengeFor(CHALLENGES, date);
    const st = challengeStatus(ch, await challengeContext(userId, date, tz, day));
    if (st.done) { events.push({ xp: XP.challenge, reason: "Daily challenge complete" }); await prisma.dailyActivity.update({ where: { id: day.id }, data: { challengeCompleted: true } }); }
  }
  events.push(...(await awardBadges(userId, active.map((a) => a.date))));
  const total = events.reduce((n, e) => n + e.xp, 0);
  if (total > 0) {
    await prisma.$transaction([
      prisma.userProfile.upsert({ where: { userId }, create: { userId, xp: total }, update: { xp: { increment: total } } }),
      prisma.dailyActivity.update({ where: { id: day.id }, data: { xp: { increment: total } } })
    ]);
  }
  return events;
}

export function dayBounds(date: Date, tz: string) {
  // Approximate local-day window: the activity date ±14h covers every timezone offset; filtered precisely by activityDate.
  return { gte: new Date(date.getTime() - 14 * 3600_000), lt: new Date(date.getTime() + 38 * 3600_000), tz };
}

export async function challengeContext(userId: string, date: Date, tz: string, day?: { vocabReviews: number; skills: string[] } | null) {
  const b = dayBounds(date, tz); const k = dateKey(date);
  const sameDay = (d: Date) => dateKey(activityDate(d, tz)) === k;
  const [attempts, writing, speaking] = await Promise.all([
    prisma.practiceAttempt.findMany({ where: { userId, createdAt: { gte: b.gte, lt: b.lt } }, select: { skill: true, taskType: true, percent: true, categories: true, createdAt: true } }),
    prisma.writingSubmission.findMany({ where: { userId, status: "EVALUATED", createdAt: { gte: b.gte, lt: b.lt } }, select: { wordCount: true, createdAt: true } }),
    prisma.speakingSubmission.findMany({ where: { userId, createdAt: { gte: b.gte, lt: b.lt } }, select: { createdAt: true } })
  ]);
  return {
    attempts: attempts.filter((a) => sameDay(a.createdAt)).map((a) => ({ skill: a.skill, taskType: a.taskType, percent: a.percent, categories: a.categories as Record<string, [number, number]> })),
    writingWordCounts: writing.filter((w) => sameDay(w.createdAt)).map((w) => w.wordCount),
    speakingCount: speaking.filter((s) => sameDay(s.createdAt)).length,
    vocabReviews: day?.vocabReviews ?? 0, skills: day?.skills ?? []
  };
}

export async function badgeContext(userId: string, activeDates?: Date[]): Promise<BadgeContext> {
  const goal = await activeGoal(userId);
  const [attemptCount, best, exercises, writing, speaking, vocab, fullMocks, days] = await Promise.all([
    prisma.practiceAttempt.count({ where: { userId } }),
    prisma.practiceAttempt.groupBy({ by: ["exerciseId"], where: { userId }, _max: { percent: true } }),
    prisma.exercise.findMany({ where: { published: true }, select: { id: true, slug: true, skill: true, config: true } }),
    prisma.writingSubmission.findMany({ where: { userId, status: "EVALUATED" }, select: { evaluation: true, estimatedLevel: true, exerciseId: true } }),
    prisma.speakingSubmission.findMany({ where: { userId }, select: { exerciseId: true } }),
    prisma.userVocabularyProgress.count({ where: { userId, status: { in: ["REVIEW", "MASTERED"] } } }),
    prisma.mockTestAttempt.count({ where: { userId, kind: "FULL", status: "COMPLETED" } }),
    prisma.dailyActivity.findMany({ where: { userId }, select: { date: true, skills: true, seconds: true, exercises: true, vocabReviews: true } })
  ]);
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const bestPercentBySlug: Record<string, number> = {};
  for (const b of best) { const ex = byId.get(b.exerciseId); if (ex) bestPercentBySlug[ex.slug] = b._max.percent ?? 0; }
  const taskOf = (id: string) => ((byId.get(id)?.config as { task?: number } | null)?.task ?? 0);
  const writingLevelsByTask: Record<number, number[]> = {};
  for (const w of writing) (writingLevelsByTask[taskOf(w.exerciseId)] ??= []).push(w.estimatedLevel ?? 0);
  const dates = activeDates ?? days.filter((d) => d.exercises > 0 || d.vocabReviews > 0).map((d) => d.date);
  return {
    totalSubmissions: attemptCount + writing.length + speaking.length, bestPercentBySlug,
    listeningSlugs: exercises.filter((e) => e.skill === "LISTENING").map((e) => e.slug), readingSlugs: exercises.filter((e) => e.skill === "READING").map((e) => e.slug),
    writingGrammar10: writing.filter((w) => ((w.evaluation as { scores?: { grammar?: number } } | null)?.scores?.grammar ?? 0) >= 10).length,
    vocabReviewOrMastered: vocab, speakingTasksDone: speaking.map((s) => taskOf(s.exerciseId)), writingLevelsByTask, fullMocks,
    perfectDays: days.filter((d) => new Set(d.skills).size >= 4 && d.seconds >= (goal?.dailyMinutes ?? 45) * 60).length, bestStreak: bestStreak(dates)
  };
}

async function awardBadges(userId: string, activeDates: Date[]): Promise<XpEvent[]> {
  const earned = await prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true } });
  const ctx = await badgeContext(userId, activeDates);
  const fresh = newlyEarned(ctx, new Set(earned.map((e) => e.achievement.key)));
  const events: XpEvent[] = [];
  for (const b of fresh) {
    const a = await prisma.achievement.upsert({ where: { key: b.key }, create: { key: b.key, name: b.name, description: b.description, icon: b.icon, xpReward: b.xpReward }, update: {} });
    const res = await prisma.userAchievement.createMany({ data: [{ userId, achievementId: a.id }], skipDuplicates: true });
    if (res.count) events.push({ xp: a.xpReward, reason: `Badge unlocked: ${a.name}` });
  }
  return events;
}
export { BADGES };
