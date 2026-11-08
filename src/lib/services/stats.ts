import { prisma } from "../prisma";
import { percentToLevel } from "../scoring";
import { levelFromXp } from "../xp";
import { avg, pct, activityDate, dateKey, DAY_MS } from "../utils";
import { computeStreak, bestStreak, challengeFor, challengeStatus } from "../gamification";
import { SKILLS, SKILL_NAME, CATEGORY_NAME, shortType, type SkillKey } from "../content-types";
import { CHALLENGES, activeGoal, challengeContext, userTimezone, badgeContext, BADGES } from "./activity";
import content from "../../../prisma/content.json";

export type SkillEstimate = { skill: SkillKey; level: number; count: number; avgPercent: number | null; target: number; progress: number };
export type NextActivity = { label: string; skill: SkillKey; exerciseId: string };

export async function skillEstimates(userId: string, target: number): Promise<SkillEstimate[]> {
  const [att, wr, sp] = await Promise.all([
    prisma.practiceAttempt.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { skill: true, percent: true } }),
    prisma.writingSubmission.findMany({ where: { userId, status: "EVALUATED" }, orderBy: { createdAt: "asc" }, select: { estimatedLevel: true } }),
    prisma.speakingSubmission.findMany({ where: { userId, estimatedLevel: { not: null } }, orderBy: { createdAt: "asc" }, select: { estimatedLevel: true } })
  ]);
  return SKILLS.map((skill) => {
    let level = 0, count = 0, avgPercent: number | null = null;
    if (skill === "listening" || skill === "reading") {
      const a = att.filter((x) => x.skill === skill.toUpperCase()); count = a.length;
      const recent = a.slice(-5); if (recent.length) { avgPercent = Math.round(avg(recent.map((x) => x.percent))); level = percentToLevel(avgPercent); }
    } else {
      const list = (skill === "writing" ? wr : sp).map((x) => x.estimatedLevel ?? 0).filter(Boolean); count = list.length;
      const recent = list.slice(-3); if (recent.length) level = Math.round(avg(recent));
    }
    return { skill, level, count, avgPercent, target, progress: level ? Math.min(100, Math.round((level / target) * 100)) : 0 };
  });
}

export async function nextActivities(userId: string): Promise<Record<SkillKey, NextActivity>> {
  const [ex, best, wr, sp] = await Promise.all([
    prisma.exercise.findMany({ where: { published: true }, orderBy: [{ part: "asc" }, { slug: "asc" }], select: { id: true, slug: true, skill: true, part: true, difficulty: true, taskType: true, title: true, config: true } }),
    prisma.practiceAttempt.groupBy({ by: ["exerciseId"], where: { userId }, _max: { percent: true } }),
    prisma.writingSubmission.groupBy({ by: ["exerciseId"], where: { userId, status: "EVALUATED" }, _avg: { estimatedLevel: true }, _count: true }),
    prisma.speakingSubmission.groupBy({ by: ["exerciseId"], where: { userId }, _avg: { estimatedLevel: true }, _count: true })
  ]);
  const bm = new Map(best.map((b) => [b.exerciseId, b._max.percent ?? 0]));
  // Rotate through parts/tasks (fewest finished first), easier before harder, so daily practice stays varied.
  const rank = { INTERMEDIATE: 0, ADVANCED: 1, EXPERT: 2 } as const;
  type Row = (typeof ex)[number];
  const grp = (e: Row) => (e.config as { task?: number } | null)?.task ?? e.part;
  const pickVaried = (list: Row[], done: (id: string) => boolean): Row | undefined => {
    const doneIn = new Map<number, number>(); list.forEach((e) => { if (done(e.id)) doneIn.set(grp(e), (doneIn.get(grp(e)) ?? 0) + 1); });
    return list.filter((e) => !done(e.id)).sort((a, b) => (doneIn.get(grp(a)) ?? 0) - (doneIn.get(grp(b)) ?? 0) || grp(a) - grp(b) || rank[a.difficulty] - rank[b.difficulty] || a.slug.localeCompare(b.slug, undefined, { numeric: true }))[0];
  };
  const pick = (skill: string) => { const list = ex.filter((e) => e.skill === skill); const un = pickVaried(list, (id) => bm.has(id)); return un ?? [...list].sort((a, b) => (bm.get(a.id) ?? 0) - (bm.get(b.id) ?? 0))[0]; };
  const lis = pick("LISTENING"), rd = pick("READING");
  const pickTask = (skill: "WRITING" | "SPEAKING", groups: { exerciseId: string; _avg: { estimatedLevel: number | null }; _count: number }[]) => {
    const g = new Map(groups.map((x) => [x.exerciseId, x])); const list = ex.filter((e) => e.skill === skill);
    const un = pickVaried(list, (id) => g.has(id)); return un ?? [...list].sort((a, b) => (g.get(a.id)?._avg.estimatedLevel ?? 0) - (g.get(b.id)?._avg.estimatedLevel ?? 0))[0];
  };
  const w = pickTask("WRITING", wr), s = pickTask("SPEAKING", sp);
  const task = (e: { config: unknown }) => (e.config as { task?: number } | null)?.task;
  return {
    listening: { skill: "listening", exerciseId: lis.id, label: `Part ${lis.part}: ${shortType(lis.taskType)}` },
    reading: { skill: "reading", exerciseId: rd.id, label: `Part ${rd.part}: ${shortType(rd.taskType)}` },
    writing: { skill: "writing", exerciseId: w.id, label: `Task ${task(w)}: ${w.title}` },
    speaking: { skill: "speaking", exerciseId: s.id, label: `Task ${task(s)}: ${s.taskType}` }
  };
}

export async function categoryStats(userId: string) {
  const at = await prisma.practiceAttempt.findMany({ where: { userId }, select: { categories: true, skill: true } });
  const out: Record<string, { right: number; total: number; skills: Record<string, number> }> = {};
  for (const a of at) for (const [k, [r, t]] of Object.entries(a.categories as Record<string, [number, number]>)) { const o = (out[k] ??= { right: 0, total: 0, skills: {} }); o.right += r; o.total += t; o.skills[a.skill] = (o.skills[a.skill] ?? 0) + t; }
  return Object.entries(out).map(([key, v]) => ({ key, name: CATEGORY_NAME[key] ?? key, right: v.right, total: v.total, percent: pct(v.right, v.total), skill: (Object.entries(v.skills).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "READING").toLowerCase() as SkillKey })).sort((a, b) => a.percent - b.percent);
}

export type Recommendation = { text: string; href: string; cta: string };
export function buildRecommendations(i: { estimates: SkillEstimate[]; categories: Awaited<ReturnType<typeof categoryStats>>; next: Record<SkillKey, NextActivity>; dueWords: number; daysToExam: number | null; recentMock: boolean }): Recommendation[] {
  const out: Recommendation[] = [];
  const href = (n: NextActivity) => `/${n.skill}/${n.exerciseId}`;
  const weak = i.categories.find((c) => c.total >= 3 && c.percent < 85);
  if (weak) out.push({ text: `Your ${SKILL_NAME[weak.skill].toLowerCase()} accuracy on ${weak.name.toLowerCase()} questions is ${weak.percent}%. Complete three exercises with this question type this week, and read every explanation.`, href: href(i.next[weak.skill]), cta: "Practise now" });
  const unmeasured = i.estimates.find((e) => !e.level);
  if (unmeasured) out.push({ text: `You haven’t measured ${SKILL_NAME[unmeasured.skill]} yet. Start with ${i.next[unmeasured.skill].label} to get your first estimate.`, href: href(i.next[unmeasured.skill]), cta: "Start" });
  const measured = i.estimates.filter((e) => e.level).sort((a, b) => a.level - b.level);
  if (measured.length >= 2) { const m = measured[0]; out.push({ text: `${SKILL_NAME[m.skill]} is your lowest skill at an estimated level ${m.level}. Next up: ${i.next[m.skill].label}.`, href: href(i.next[m.skill]), cta: "Practise" }); }
  if (i.dueWords) out.push({ text: `${i.dueWords} vocabulary card${i.dueWords === 1 ? " is" : "s are"} due for review. A five-minute session keeps them from slipping.`, href: "/vocabulary", cta: "Review cards" });
  if (i.daysToExam !== null && i.daysToExam >= 0 && i.daysToExam <= 30 && !i.recentMock) out.push({ text: `Your exam is in ${i.daysToExam} day${i.daysToExam === 1 ? "" : "s"}. Take a full mock test this week to rehearse timing.`, href: "/mock", cta: "Open mock tests" });
  if (!out.length) out.push({ text: "You’re on track. Try a full mock test to check your stamina across all four skills.", href: "/mock", cta: "Open mock tests" });
  return out.slice(0, 4);
}

export function buildDailyPlan(i: { dailyMinutes: number; estimates: SkillEstimate[]; next: Record<SkillKey, NextActivity>; dueWords: number; daysToExam: number | null }) {
  const m = i.dailyMinutes; const ranked = [...i.estimates].sort((a, b) => a.level - b.level);
  const plan: { title: string; minutes: number; href: string }[] = [];
  if (i.daysToExam !== null && i.daysToExam >= 0 && i.daysToExam <= 14 && m >= 45) plan.push({ title: `Section-wise mock: ${SKILL_NAME[ranked[0].skill]}`, minutes: Math.round(m * 0.5), href: "/mock" });
  plan.push({ title: `${SKILL_NAME[ranked[0].skill]}: ${i.next[ranked[0].skill].label}`, minutes: Math.round(m * (plan.length ? 0.25 : 0.4)), href: `/${ranked[0].skill}/${i.next[ranked[0].skill].exerciseId}` });
  plan.push({ title: `${SKILL_NAME[ranked[1].skill]}: ${i.next[ranked[1].skill].label}`, minutes: Math.round(m * 0.25), href: `/${ranked[1].skill}/${i.next[ranked[1].skill].exerciseId}` });
  plan.push({ title: `Vocabulary: ${i.dueWords ? `${i.dueWords} due cards` : "learn 5 new words"}`, minutes: Math.max(5, Math.round(m * 0.15)), href: "/vocabulary" });
  const used = plan.reduce((n, p) => n + p.minutes, 0); if (m - used >= 5) plan.push({ title: "Review explanations from your recent incorrect answers", minutes: m - used, href: "/progress" });
  return plan;
}

export async function dashboardData(userId: string) {
  const [user, profile, goal, tz] = await Promise.all([prisma.user.findUnique({ where: { id: userId } }), prisma.userProfile.findUnique({ where: { userId } }), activeGoal(userId), userTimezone(userId)]);
  const target = goal?.targetScore ?? 12; const today = activityDate(new Date(), tz);
  const [estimates, next, cats, days, dueWords, attemptAgg, exerciseCount, recentMock] = await Promise.all([
    skillEstimates(userId, target), nextActivities(userId), categoryStats(userId),
    prisma.dailyActivity.findMany({ where: { userId }, select: { date: true, seconds: true, exercises: true, vocabReviews: true } }),
    prisma.userVocabularyProgress.count({ where: { userId, status: { not: "NEW" }, dueAt: { lte: new Date() } } }),
    prisma.practiceAttempt.aggregate({ where: { userId }, _avg: { percent: true } }),
    Promise.all([prisma.practiceAttempt.count({ where: { userId } }), prisma.writingSubmission.count({ where: { userId, status: "EVALUATED" } }), prisma.speakingSubmission.count({ where: { userId } })]).then((a) => a.reduce((x, y) => x + y, 0)),
    prisma.mockTestAttempt.count({ where: { userId, status: "COMPLETED", completedAt: { gte: new Date(Date.now() - 7 * DAY_MS) } } })
  ]);
  const todayRow = days.find((d) => dateKey(d.date) === dateKey(today));
  const active = days.filter((d) => d.exercises > 0 || d.vocabReviews > 0).map((d) => d.date);
  const daysToExam = goal?.examDate ? Math.ceil((goal.examDate.getTime() - Date.now()) / DAY_MS) : null;
  const levels = estimates.map((e) => e.level).filter(Boolean);
  const ch = challengeFor(CHALLENGES, today);
  const chDay = await prisma.dailyActivity.findUnique({ where: { userId_date: { userId, date: today } } });
  const chStatus = challengeStatus(ch, await challengeContext(userId, today, tz, chDay));
  return {
    name: profile?.displayName || user?.name || "", target, xp: profile?.xp ?? 0, xpLevel: levelFromXp(profile?.xp ?? 0),
    estimates, next, overallLevel: levels.length ? Math.round(avg(levels)) : 0, overallProgress: Math.round(avg(estimates.map((e) => e.progress))),
    streak: computeStreak(active, today), totalHours: +(days.reduce((n, d) => n + d.seconds, 0) / 3600).toFixed(1), todayMinutes: Math.round((todayRow?.seconds ?? 0) / 60),
    dailyMinutes: goal?.dailyMinutes ?? 45, daysToExam, exerciseCount, avgPercent: attemptAgg._avg.percent !== null ? Math.round(attemptAgg._avg.percent) : null,
    challenge: { ...ch, ...chStatus, claimed: !!chDay?.challengeCompleted }, quote: content.quotes[Math.floor(today.getTime() / DAY_MS) % content.quotes.length],
    recommendations: buildRecommendations({ estimates, categories: cats, next, dueWords, daysToExam, recentMock: recentMock > 0 }),
    plan: buildDailyPlan({ dailyMinutes: goal?.dailyMinutes ?? 45, estimates, next, dueWords, daysToExam }), dueWords
  };
}

export async function analyticsData(userId: string) {
  const goal = await activeGoal(userId); const tz = await userTimezone(userId);
  const [attempts, writing, speaking, mocks, days, vocab, totalWords, cats] = await Promise.all([
    prisma.practiceAttempt.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { skill: true, taskType: true, percent: true, correct: true, total: true, durationSec: true, createdAt: true, fromMock: true } }),
    prisma.writingSubmission.findMany({ where: { userId, status: "EVALUATED" }, orderBy: { createdAt: "asc" }, select: { estimatedLevel: true, createdAt: true } }),
    prisma.speakingSubmission.findMany({ where: { userId, estimatedLevel: { not: null } }, orderBy: { createdAt: "asc" }, select: { estimatedLevel: true, createdAt: true } }),
    prisma.mockTestAttempt.findMany({ where: { userId, status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 12, select: { id: true, label: true, completedAt: true, overallLevel: true, listeningLevel: true, readingLevel: true, writingLevel: true, speakingLevel: true, durationSec: true } }),
    prisma.dailyActivity.findMany({ where: { userId }, select: { date: true, seconds: true } }),
    prisma.userVocabularyProgress.groupBy({ by: ["status"], where: { userId }, _count: true }),
    prisma.vocabularyWord.count(), categoryStats(userId)
  ]);
  const timeline = [
    ...attempts.map((a) => ({ t: a.createdAt.getTime(), skill: a.skill.toLowerCase(), level: percentToLevel(a.percent), label: `${a.percent}%` })),
    ...writing.map((w) => ({ t: w.createdAt.getTime(), skill: "writing", level: w.estimatedLevel ?? 0, label: `level ${w.estimatedLevel}` })),
    ...speaking.map((s) => ({ t: s.createdAt.getTime(), skill: "speaking", level: s.estimatedLevel ?? 0, label: `level ${s.estimatedLevel}` }))
  ].sort((a, b) => a.t - b.t);
  const byType: Record<string, number[]> = {}; attempts.filter((a) => !a.fromMock).forEach((a) => (byType[a.taskType] ??= []).push(a.durationSec));
  const vc = Object.fromEntries(vocab.map((v) => [v.status, v._count])) as Record<string, number>;
  const started = (vc.LEARNING ?? 0) + (vc.REVIEW ?? 0) + (vc.MASTERED ?? 0);
  const last14 = Array.from({ length: 14 }, (_, i) => { const d = new Date(activityDate(new Date(), tz).getTime() - (13 - i) * DAY_MS); const row = days.find((x) => dateKey(x.date) === dateKey(d)); return { day: d.toISOString().slice(5, 10), minutes: Math.round((row?.seconds ?? 0) / 60) }; });
  const trend = SKILLS.map((s) => { const vals = timeline.filter((x) => x.skill === s).map((x) => x.level); if (vals.length < 2) return { skill: s, from: null, to: null, delta: 0 }; const n = Math.max(1, Math.min(3, Math.floor(vals.length / 2))); const a = avg(vals.slice(0, n)), b = avg(vals.slice(-n)); return { skill: s, from: +a.toFixed(1), to: +b.toFixed(1), delta: +(b - a).toFixed(1) }; });
  const correct = attempts.reduce((n, a) => n + a.correct, 0), total = attempts.reduce((n, a) => n + a.total, 0);
  return {
    kpis: { accuracy: total ? pct(correct, total) : null, correct, total, hours: +(days.reduce((n, d) => n + d.seconds, 0) / 3600).toFixed(1), activeDays: days.length, avgSeconds: attempts.length ? Math.round(avg(attempts.map((a) => a.durationSec))) : null, mocks: mocks.length },
    timeline, estimates: await skillEstimates(userId, goal?.targetScore ?? 12), categories: cats,
    times: Object.entries(byType).map(([k, v]) => ({ type: shortType(k), minutes: +(avg(v) / 60).toFixed(1), n: v.length })),
    vocab: { NEW: totalWords - started, LEARNING: vc.LEARNING ?? 0, REVIEW: vc.REVIEW ?? 0, MASTERED: vc.MASTERED ?? 0 }, last14, trend,
    mocks: mocks.map((m) => ({ ...m, completedAt: m.completedAt?.toISOString() ?? null })),
    bestStreak: bestStreak(days.map((d) => d.date))
  };
}

export async function achievementsData(userId: string) {
  const [profile, earned, ctx, days, tz] = await Promise.all([prisma.userProfile.findUnique({ where: { userId } }), prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true } }), badgeContext(userId), prisma.dailyActivity.findMany({ where: { userId } }), userTimezone(userId)]);
  const goal = await activeGoal(userId);
  const today = activityDate(new Date(), tz); const dow = (today.getUTCDay() + 6) % 7; const weekStart = today.getTime() - dow * DAY_MS;
  const week = days.filter((d) => d.date.getTime() >= weekStart);
  const counts = await Promise.all([prisma.practiceAttempt.count({ where: { userId, skill: "LISTENING" } }), prisma.practiceAttempt.count({ where: { userId, skill: "READING" } }), prisma.writingSubmission.count({ where: { userId, status: "EVALUATED" } }), prisma.speakingSubmission.count({ where: { userId } })]);
  const bests = await prisma.practiceAttempt.groupBy({ by: ["exerciseId"], where: { userId }, _max: { percent: true } });
  const ex = await prisma.exercise.findMany({ where: { skill: { in: ["LISTENING", "READING"] } }, orderBy: [{ skill: "asc" }, { part: "asc" }], select: { id: true, skill: true, taskType: true } });
  const wrBest = await prisma.writingSubmission.aggregate({ where: { userId, status: "EVALUATED" }, _max: { estimatedLevel: true } });
  const spBest = await prisma.speakingSubmission.aggregate({ where: { userId }, _max: { estimatedLevel: true } });
  const earnedMap = new Map(earned.map((e) => [e.achievement.key, e.earnedAt]));
  return {
    xp: profile?.xp ?? 0, level: levelFromXp(profile?.xp ?? 0),
    week: { activeDays: week.filter((d) => d.exercises > 0 || d.vocabReviews > 0).length, goalDays: goal?.weeklyGoalDays ?? 5, xp: week.reduce((n, d) => n + d.xp, 0), exercises: week.reduce((n, d) => n + d.exercises, 0) },
    streak: computeStreak(days.filter((d) => d.exercises > 0 || d.vocabReviews > 0).map((d) => d.date), today), bestStreak: ctx.bestStreak,
    badges: BADGES.map((b) => ({ key: b.key, name: b.name, description: b.description, icon: b.icon, earnedAt: earnedMap.get(b.key)?.toISOString() ?? null, progress: b.progress?.(ctx) ?? null })),
    milestones: SKILLS.map((s, i) => ({ skill: s, count: counts[i] })),
    personalBests: [...ex.map((e) => ({ label: shortType(e.taskType), skill: e.skill.toLowerCase(), value: bests.find((b) => b.exerciseId === e.id)?._max.percent ?? null, unit: "%" })),
      { label: "Writing (best level)", skill: "writing", value: wrBest._max.estimatedLevel, unit: "" }, { label: "Speaking (best level)", skill: "speaking", value: spBest._max.estimatedLevel, unit: "" }]
  };
}
