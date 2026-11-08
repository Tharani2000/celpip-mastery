import type { Prisma, MockKind, Skill } from "@prisma/client";
import { prisma } from "../prisma";
import { overallLevel, mergeCategories, percentToLevel } from "../scoring";
import { mockXp } from "../xp";
import { pct, wordCount, avg } from "../utils";
import { evaluateMockBatch } from "../ai/evaluate";
import { aiNotice } from "../ai/provider";
import { demoWriting, demoSpeaking } from "../ai/demo";
import { CATEGORY_NAME, type WritingConfig, type SpeakingConfig } from "../content-types";
import type { MockItemResult } from "../validation";
import { getPublicExercise } from "./content";
import { submitPractice, NotFoundError } from "./practice";
import { logActivity } from "./activity";

export class ConflictError extends Error { status = 409; }
const ORDER: Skill[] = ["LISTENING", "READING", "WRITING", "SPEAKING"];
export type PlanSection = { skill: Skill; items: string[] };

async function leastUsed(userId: string, skill: "WRITING" | "SPEAKING", task: number) {
  const ex = (await prisma.exercise.findMany({ where: { skill, published: true }, orderBy: { slug: "asc" } })).filter((e) => (e.config as { task?: number }).task === task);
  const counts = skill === "WRITING" ? await prisma.writingSubmission.groupBy({ by: ["exerciseId"], where: { userId }, _count: true }) : await prisma.speakingSubmission.groupBy({ by: ["exerciseId"], where: { userId }, _count: true });
  const m = new Map(counts.map((c) => [c.exerciseId, c._count]));
  return [...ex].sort((a, b) => (m.get(a.id) ?? 0) - (m.get(b.id) ?? 0))[0]?.id;
}
/** One exercise per part: the one this learner has practised least (easier ones first on ties), so every mock is different until the bank runs out. */
async function leastPracticedPerPart(userId: string, skill: "LISTENING" | "READING"): Promise<string[]> {
  const ex = await prisma.exercise.findMany({ where: { skill, published: true }, select: { id: true, part: true, slug: true, difficulty: true } });
  const counts = await prisma.practiceAttempt.groupBy({ by: ["exerciseId"], where: { userId }, _count: true });
  const used = new Map(counts.map((c) => [c.exerciseId, c._count]));
  const rank = { INTERMEDIATE: 0, ADVANCED: 1, EXPERT: 2 } as const;
  const best = new Map<number, (typeof ex)[number]>();
  for (const e of ex) {
    const b = best.get(e.part);
    const key = (x: typeof e) => [used.get(x.id) ?? 0, rank[x.difficulty], x.slug] as const;
    if (!b) { best.set(e.part, e); continue; }
    const [a1, a2, a3] = key(e), [b1, b2, b3] = key(b);
    if (a1 < b1 || (a1 === b1 && (a2 < b2 || (a2 === b2 && a3.localeCompare(b3, undefined, { numeric: true }) < 0)))) best.set(e.part, e);
  }
  return [...best.entries()].sort((x, y) => x[0] - y[0]).map(([, e]) => e.id);
}
async function sectionItems(userId: string, skill: Skill): Promise<string[]> {
  if (skill === "LISTENING" || skill === "READING") return leastPracticedPerPart(userId, skill);
  const tasks = skill === "WRITING" ? [1, 2] : [1, 2, 3, 4, 5, 6, 7, 8];
  return (await Promise.all(tasks.map((t) => leastUsed(userId, skill, t)))).filter((x): x is string => !!x);
}

export async function startMock(userId: string, input: { kind: "FULL" } | { kind: "SECTION"; skill: Skill } | { kind: "CUSTOM"; exerciseIds: string[]; untimed: boolean }) {
  let plan: PlanSection[] = []; let label = ""; let slug = "";
  if (input.kind === "FULL") { plan = await Promise.all(ORDER.map(async (skill) => ({ skill, items: await sectionItems(userId, skill) }))); label = "Full mock"; slug = "full-mock"; }
  else if (input.kind === "SECTION") { plan = [{ skill: input.skill, items: await sectionItems(userId, input.skill) }]; label = `${input.skill[0]}${input.skill.slice(1).toLowerCase()} mock`; slug = `section-${input.skill.toLowerCase()}`; }
  else {
    const ex = await prisma.exercise.findMany({ where: { id: { in: input.exerciseIds }, published: true }, orderBy: [{ part: "asc" }, { slug: "asc" }] });
    plan = ORDER.map((skill) => ({ skill, items: ex.filter((e) => e.skill === skill).sort((a, b) => ((a.config as { task?: number } | null)?.task ?? a.part) - ((b.config as { task?: number } | null)?.task ?? b.part)).map((e) => e.id) })).filter((s) => s.items.length);
    label = "Custom test"; slug = "custom";
  }
  if (!plan.length || plan.every((s) => !s.items.length)) throw new NotFoundError("No exercises selected");
  const template = await prisma.mockTest.findUnique({ where: { slug } });
  await prisma.mockTestAttempt.updateMany({ where: { userId, status: "IN_PROGRESS" }, data: { status: "ABANDONED" } });
  return prisma.mockTestAttempt.create({ data: { userId, mockTestId: template?.id, kind: input.kind as MockKind, label, plan: plan as unknown as Prisma.InputJsonValue, untimed: input.kind === "CUSTOM" ? input.untimed : false } });
}

export async function getMockSession(userId: string, attemptId: string) {
  const a = await prisma.mockTestAttempt.findFirst({ where: { id: attemptId, userId } });
  if (!a) throw new NotFoundError("Mock test not found");
  const plan = a.plan as unknown as PlanSection[];
  if (a.status !== "IN_PROGRESS") return { attempt: a, sections: [] };
  const sections = await Promise.all(plan.map(async (s) => ({ skill: s.skill, items: (await Promise.all(s.items.map((id) => getPublicExercise(id)))).filter((x): x is NonNullable<typeof x> => !!x) })));
  return { attempt: a, sections };
}

export type MockResults = {
  sections: Partial<Record<"listening" | "reading", { correct: number; total: number; percent: number; level: number }>>;
  categories: { key: string; name: string; right: number; total: number; percent: number }[];
  objective: { exerciseId: string; skill: string; part: number; title: string; correct: number; total: number; review: Awaited<ReturnType<typeof submitPractice>>["review"] }[];
  writing: { exerciseId: string; submissionId: string; title: string; task: number; text: string; words: number; level: number; comment: string }[];
  speaking: { exerciseId: string; submissionId: string | null; task: number; type: string; transcript: string; durationSec: number; level: number; comment: string; hasAudio: boolean }[];
  evalMode: "AI" | "DEMO" | null; notice: string | null; improvements: string[]; recommended: { href: string; label: string }[];
};

export async function submitMock(userId: string, attemptId: string, items: MockItemResult[], opts: { fetcher?: typeof fetch } = {}) {
  const a = await prisma.mockTestAttempt.findFirst({ where: { id: attemptId, userId } });
  if (!a) throw new NotFoundError("Mock test not found");
  if (a.status !== "IN_PROGRESS") throw new ConflictError("This mock test has already been submitted.");
  const planIds = new Set((a.plan as unknown as PlanSection[]).flatMap((s) => s.items));
  const valid = items.filter((i) => planIds.has(i.exerciseId));
  const exercises = new Map((await prisma.exercise.findMany({ where: { id: { in: [...planIds] } } })).map((e) => [e.id, e]));
  const results: MockResults = { sections: {}, categories: [], objective: [], writing: [], speaking: [], evalMode: null, notice: null, improvements: [], recommended: [] };
  let answered = 0, totalQ = 0; const catList: Record<string, [number, number]>[] = [];
  for (const it of valid.filter((i): i is Extract<MockItemResult, { type: "objective" }> => i.type === "objective")) {
    const r = await submitPractice(userId, it, { fromMock: true, skipActivity: true }); const ex = exercises.get(it.exerciseId)!;
    answered += Object.values(it.answers).filter(Boolean).length; totalQ += r.total; catList.push(r.categories);
    results.objective.push({ exerciseId: ex.id, skill: ex.skill.toLowerCase(), part: ex.part, title: ex.title, correct: r.correct, total: r.total, review: r.review });
  }
  for (const skill of ["listening", "reading"] as const) {
    const list = results.objective.filter((o) => o.skill === skill); if (!list.length) continue;
    const c = list.reduce((n, o) => n + o.correct, 0), t = list.reduce((n, o) => n + o.total, 0);
    results.sections[skill] = { correct: c, total: t, percent: pct(c, t), level: percentToLevel(pct(c, t)) };
  }
  results.categories = Object.entries(mergeCategories(catList)).map(([key, [right, total]]) => ({ key, name: CATEGORY_NAME[key] ?? key, right, total, percent: pct(right, total) })).sort((x, y) => x.percent - y.percent);

  const wr = valid.filter((i): i is Extract<MockItemResult, { type: "writing" }> => i.type === "writing");
  const sp = valid.filter((i): i is Extract<MockItemResult, { type: "speaking" }> => i.type === "speaking");
  const aiMode = (await prisma.userProfile.findUnique({ where: { userId }, select: { aiMode: true } }))?.aiMode;
  let batch: Awaited<ReturnType<typeof evaluateMockBatch>> = null;
  if (wr.length || sp.length) {
    try {
      batch = await evaluateMockBatch([
        ...wr.map((w) => { const c = exercises.get(w.exerciseId)!.config as unknown as WritingConfig; return { id: w.exerciseId, kind: "writing" as const, prompt: `${c.prompt} ${(c.points ?? c.options ?? []).join(" | ")}`, response: w.text, meta: `Task ${c.task}, ${c.min}–${c.max} words, ${wordCount(w.text)} written` }; }),
        ...sp.map((s) => { const c = exercises.get(s.exerciseId)!.config as unknown as SpeakingConfig; return { id: s.exerciseId, kind: "speaking" as const, prompt: c.prompt, response: s.transcript, meta: `Task ${c.task}, ${c.speak}s, spoke ${Math.round(s.durationSec)}s` }; })
      ], { forceDemo: aiMode === "demo", fetcher: opts.fetcher });
      results.evalMode = "AI";
    } catch (e) { results.evalMode = "DEMO"; results.notice = aiMode === "demo" ? "Demo mode is on in your settings." : aiNotice(e); }
  }
  for (const w of wr) {
    const ex = exercises.get(w.exerciseId)!; const c = ex.config as unknown as WritingConfig; const words = wordCount(w.text);
    const ai = batch?.writing.find((x) => x.id === w.exerciseId);
    const level = ai?.level ?? (words < 10 ? 1 : demoWriting(c, w.text, "").level);
    const comment = ai?.comment || (words < 10 ? "No response submitted." : "Demo estimate from length, structure and linking words.");
    const sub = await prisma.writingSubmission.create({ data: { userId, exerciseId: ex.id, status: "EVALUATED", text: w.text, wordCount: words, durationSec: Math.round(w.durationSec), estimatedLevel: level, evaluation: { brief: true, level, comment, mode: ai ? "AI" : "DEMO" }, evalMode: ai ? "AI" : "DEMO", fromMock: true } });
    results.writing.push({ exerciseId: ex.id, submissionId: sub.id, title: ex.title, task: c.task, text: w.text, words, level, comment });
  }
  for (const s of sp) {
    const ex = exercises.get(s.exerciseId)!; const c = ex.config as unknown as SpeakingConfig;
    const ai = batch?.speaking.find((x) => x.id === s.exerciseId); const words = wordCount(s.transcript);
    const level = ai?.level ?? (words < 10 ? 1 : demoSpeaking(c, s.transcript, s.durationSec, "").level);
    const comment = ai?.comment || (words < 10 ? "Nothing was transcribed for this task." : "Demo estimate from pace, fillers and linking words.");
    let subId: string | null = null; let hasAudio = false;
    const data = { transcript: s.transcript, estimatedLevel: level, evaluation: { brief: true, level, comment, mode: ai ? "AI" : "DEMO" }, evalMode: (ai ? "AI" : "DEMO") as "AI" | "DEMO", status: "EVALUATED" as const };
    const existing = s.submissionId ? await prisma.speakingSubmission.findFirst({ where: { id: s.submissionId, userId, exerciseId: ex.id } }) : null;
    if (existing) { await prisma.speakingSubmission.update({ where: { id: existing.id }, data }); subId = existing.id; hasAudio = !!existing.audioPath; }
    else if (words) subId = (await prisma.speakingSubmission.create({ data: { userId, exerciseId: ex.id, durationSec: Math.round(s.durationSec), transcriptSource: "browser", fromMock: true, ...data } })).id;
    results.speaking.push({ exerciseId: ex.id, submissionId: subId, task: c.task, type: ex.taskType, transcript: s.transcript, durationSec: Math.round(s.durationSec), level, comment, hasAudio });
  }
  const lv = { listening: results.sections.listening?.level ?? null, reading: results.sections.reading?.level ?? null, writing: results.writing.length ? Math.round(avg(results.writing.map((w) => w.level))) : null, speaking: results.speaking.length ? Math.round(avg(results.speaking.map((s) => s.level))) : null };
  const overall = overallLevel(Object.values(lv));
  const present = Object.entries(lv).filter(([, v]) => v !== null) as [string, number][];
  if (present.length > 1) { const low = present.sort((x, y) => x[1] - y[1])[0]; results.improvements.push(`${low[0][0].toUpperCase() + low[0].slice(1)} was your lowest section (≈ ${low[1]}).`); }
  results.categories.filter((c) => c.percent < 70).slice(0, 3).forEach((c) => results.improvements.push(`${c.name} questions: ${c.right} of ${c.total} correct.`));
  results.writing.filter((w) => w.level < 9).forEach((w) => results.improvements.push(`Writing Task ${w.task}: ${w.comment}`));
  results.speaking.filter((s) => s.level < 9).slice(0, 2).forEach((s) => results.improvements.push(`Speaking Task ${s.task}: ${s.comment}`));
  results.objective.filter((o) => pct(o.correct, o.total) < 85).forEach((o) => results.recommended.push({ href: `/${o.skill}/${o.exerciseId}`, label: `${o.skill === "listening" ? "Listening" : "Reading"} Part ${o.part}: ${o.title}` }));
  results.writing.filter((w) => w.level < 10).forEach((w) => results.recommended.push({ href: `/writing/${w.exerciseId}`, label: `Rewrite: ${w.title}` }));
  results.speaking.filter((s) => s.level < 10).slice(0, 3).forEach((s) => results.recommended.push({ href: `/speaking/${s.exerciseId}`, label: `Speaking Task ${s.task}` }));
  const durationSec = Math.round((Date.now() - a.startedAt.getTime()) / 1000);
  const xp = mockXp(a.kind, totalQ ? answered / totalQ : 1);
  const updated = await prisma.mockTestAttempt.update({ where: { id: a.id }, data: { status: "COMPLETED", completedAt: new Date(), durationSec, results: results as unknown as Prisma.InputJsonValue, overallLevel: overall, listeningLevel: lv.listening, readingLevel: lv.reading, writingLevel: lv.writing, speakingLevel: lv.speaking, evalMode: results.evalMode ?? undefined, xpAwarded: xp } });
  const firstSkill = (a.plan as unknown as PlanSection[])[0]?.skill;
  const events = await logActivity(userId, { seconds: durationSec, skill: firstSkill, countsAsExercise: true, xp: [{ xp, reason: `${a.label} complete` }] });
  for (const s of (a.plan as unknown as PlanSection[]).slice(1)) await logActivity(userId, { seconds: 0, skill: s.skill });
  return { attempt: updated, results, events };
}

export async function getMockResult(userId: string, attemptId: string) {
  const a = await prisma.mockTestAttempt.findFirst({ where: { id: attemptId, userId, status: "COMPLETED" } });
  if (!a) throw new NotFoundError("Mock result not found");
  return a;
}
