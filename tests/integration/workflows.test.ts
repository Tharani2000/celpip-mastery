/* Integration tests: run against a real PostgreSQL database (DATABASE_URL), seeded with `npm run db:seed`.
   AI is forced into demo mode so tests are deterministic and offline. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
process.env.AI_PROVIDER = "demo";
import { prisma } from "@/lib/prisma";
import { createUser, resetProgress, EmailTakenError } from "@/lib/services/profile";
import { getPublicExercise } from "@/lib/services/content";
import { submitPractice } from "@/lib/services/practice";
import { submitWriting, saveDraft, getDraft } from "@/lib/services/writing";
import { submitSpeaking } from "@/lib/services/speaking";
import { reviewWord } from "@/lib/services/vocabulary";
import { startMock, getMockSession, submitMock } from "@/lib/services/mock";
import { dashboardData, analyticsData, achievementsData } from "@/lib/services/stats";

const tag = `it-${Date.now()}`;
let userId = ""; let otherId = "";
const LONG = "Dear Mr. Patel,\n\nI am writing regarding my kitchen renovation, which was scheduled to take three weeks but is now in its sixth week. The cabinets are installed; however, the countertops and plumbing remain unfinished, and nobody has been on site since last Tuesday.\n\nThis delay is causing considerable difficulty. My family has been without a working sink for almost a month, so we are eating takeout most nights, which is expensive. Moreover, I took two days off work to supervise deliveries that never arrived.\n\nTherefore, I would ask you to provide a written schedule for the remaining work by Friday and to complete the project within two weeks. If this is not feasible, I would appreciate a discussion about reducing the final invoice to reflect the inconvenience.\n\nThank you for your prompt attention.\n\nSincerely,\nAmira Haddad";

async function correctAnswers(exerciseId: string) {
  const qs = await prisma.question.findMany({ where: { exerciseId }, include: { options: true } });
  return Object.fromEntries(qs.map((q) => [q.id, q.options.find((o) => o.isCorrect)!.id]));
}

beforeAll(async () => {
  userId = (await createUser({ name: "Test Learner", email: `${tag}@example.com`, password: "password123" })).id;
  otherId = (await createUser({ name: "Other", email: `${tag}-b@example.com`, password: "password123" })).id;
});
afterAll(async () => { await prisma.user.deleteMany({ where: { email: { startsWith: tag } } }); await prisma.$disconnect(); });

describe("accounts", () => {
  it("creates profile and goal and rejects duplicate emails", async () => {
    expect(await prisma.userProfile.findUnique({ where: { userId } })).toBeTruthy();
    expect((await prisma.learningGoal.findFirst({ where: { userId } }))?.targetScore).toBe(12);
    await expect(createUser({ name: "Dup", email: `${tag}@example.com`, password: "password123" })).rejects.toBeInstanceOf(EmailTakenError);
    const u = await prisma.user.findUnique({ where: { id: userId } }); expect(u?.passwordHash).not.toContain("password123");
  });
});

describe("listening and reading practice", () => {
  it("never sends correct answers or explanations to the browser", async () => {
    const ex = await getPublicExercise("L1");
    const json = JSON.stringify(ex);
    expect(json).not.toContain("isCorrect"); expect(json).not.toContain("explanation");
    expect(ex!.questions.length).toBeGreaterThan(0);
  });
  it("scores on the server, awards XP and the first badge", async () => {
    const ex = await prisma.exercise.findUniqueOrThrow({ where: { slug: "L1" } });
    const r = await submitPractice(userId, { exerciseId: ex.id, answers: await correctAnswers(ex.id), durationSec: 400 });
    expect(r.percent).toBe(100); expect(r.level).toBe(12); expect(r.xp).toBe(50);
    expect(r.review.every((x) => x.isCorrect && x.explanation)).toBe(true);
    expect(r.events.map((e) => e.reason)).toEqual(expect.arrayContaining(["Badge unlocked: First Steps"]));
    const profile = await prisma.userProfile.findUniqueOrThrow({ where: { userId } });
    expect(profile.xp).toBe(r.events.reduce((n, e) => n + e.xp, 0));
  });
  it("gives no XP for a rushed attempt or a same-day repeat without improvement", async () => {
    const ex = await prisma.exercise.findUniqueOrThrow({ where: { slug: "R1" } });
    const rushed = await submitPractice(userId, { exerciseId: ex.id, answers: {}, durationSec: 5 });
    expect(rushed.xp).toBe(0); expect(rushed.percent).toBe(0);
    const ok = await submitPractice(userId, { exerciseId: ex.id, answers: {}, durationSec: 500 });
    expect(ok.xp).toBe(0); expect(ok.messages[0]).toMatch(/Repeat attempt/);
  });
  it("records daily activity", async () => {
    const days = await prisma.dailyActivity.findMany({ where: { userId } });
    expect(days).toHaveLength(1); expect(days[0].exercises).toBe(3); expect(days[0].skills).toEqual(expect.arrayContaining(["LISTENING", "READING"]));
  });
});

describe("writing", () => {
  it("saves and restores drafts, then evaluates with a labelled demo fallback", async () => {
    const ex = await prisma.exercise.findUniqueOrThrow({ where: { slug: "W1" } });
    await saveDraft(userId, ex.id, "Dear Mr. Patel, draft");
    expect((await getDraft(userId, ex.id))?.text).toBe("Dear Mr. Patel, draft");
    const r = await submitWriting(userId, { exerciseId: ex.id, text: LONG, durationSec: 1200 });
    expect(r.evaluation.mode).toBe("DEMO"); expect(r.evaluation.level).toBeGreaterThanOrEqual(7); expect(r.evaluation.level).toBeLessThan(12);
    expect(r.xp).toBeGreaterThanOrEqual(30); expect(await getDraft(userId, ex.id)).toBeNull();
    const dup = await submitWriting(userId, { exerciseId: ex.id, text: LONG, durationSec: 1200 });
    expect(dup.xp).toBe(0); expect(dup.messages[0]).toMatch(/matches an earlier/);
  });
});

describe("speaking", () => {
  it("stores the transcript and audio, evaluates without scoring pronunciation", async () => {
    const ex = await prisma.exercise.findUniqueOrThrow({ where: { slug: "S1" } });
    const audio = new File([new Uint8Array([26, 69, 223, 163, 1, 2, 3])], "a.webm", { type: "audio/webm" });
    const t = "I would advise you to weigh up the promotion carefully. On the one hand the salary is higher, which would help you save for a home. On the other hand, longer hours could affect your health and family time, so ask your manager whether some flexibility is possible before you decide.";
    const r = await submitSpeaking(userId, { exerciseId: ex.id, transcript: t, transcriptSource: "browser", durationSec: 80, audio });
    expect(r.evaluation?.pronunciation.assessed).toBe(false); expect(r.hasAudio).toBe(true); expect(r.xp).toBeGreaterThan(0);
    const sub = await prisma.speakingSubmission.findUniqueOrThrow({ where: { id: r.submissionId } }); expect(sub.audioPath).toBeTruthy();
  });
  it("rejects unsupported audio types and too-short transcripts", async () => {
    const ex = await prisma.exercise.findUniqueOrThrow({ where: { slug: "S2" } });
    await expect(submitSpeaking(userId, { exerciseId: ex.id, transcript: "too short", transcriptSource: "typed", durationSec: 30 })).rejects.toThrow(/15 words/);
    await expect(submitSpeaking(userId, { exerciseId: ex.id, transcript: "x ".repeat(20), transcriptSource: "typed", durationSec: 30, audio: new File(["x"], "a.exe", { type: "application/x-msdownload" }) })).rejects.toThrow(/Unsupported/);
  });
});

describe("vocabulary", () => {
  it("schedules reviews with spaced repetition", async () => {
    const w = await prisma.vocabularyWord.findFirstOrThrow();
    const r1 = await reviewWord(userId, w.id, 3, 8); expect(r1.status).toBe("REVIEW");
    const r2 = await reviewWord(userId, w.id, 0, 8); expect(r2.status).toBe("LEARNING");
    const p = await prisma.userVocabularyProgress.findUniqueOrThrow({ where: { userId_wordId: { userId, wordId: w.id } } }); expect(p.lapses).toBe(1);
  });
});

describe("mock tests", () => {
  it("runs a full mock end to end and keeps results private", async () => {
    const a = await startMock(userId, { kind: "FULL" });
    const session = await getMockSession(userId, a.id);
    expect(session.sections.map((s) => s.skill)).toEqual(["LISTENING", "READING", "WRITING", "SPEAKING"]);
    expect(JSON.stringify(session.sections)).not.toContain("isCorrect");
    await expect(getMockSession(otherId, a.id)).rejects.toThrow(/not found/);
    const items = [];
    for (const s of session.sections) for (const it of s.items) {
      if (s.skill === "LISTENING" || s.skill === "READING") items.push({ type: "objective" as const, exerciseId: it.id, answers: await correctAnswers(it.id), durationSec: 300 });
      if (s.skill === "WRITING") items.push({ type: "writing" as const, exerciseId: it.id, text: LONG, durationSec: 1500 });
      if (s.skill === "SPEAKING") items.push({ type: "speaking" as const, exerciseId: it.id, transcript: "In this situation I would first explain my reasons calmly, and then I would suggest a compromise that works for both of us, because keeping a good relationship matters more than winning.", durationSec: 55 });
    }
    items.push({ type: "objective" as const, exerciseId: "not-in-plan", answers: {}, durationSec: 1 });
    await expect(submitMock(otherId, a.id, items)).rejects.toThrow(/not found/);
    const r = await submitMock(userId, a.id, items);
    expect(r.attempt.status).toBe("COMPLETED"); expect(r.attempt.listeningLevel).toBe(12); expect(r.attempt.readingLevel).toBe(12);
    expect(r.attempt.writingLevel).toBeGreaterThan(0); expect(r.attempt.speakingLevel).toBeGreaterThan(0); expect(r.attempt.overallLevel).toBeGreaterThan(0);
    expect(r.results.evalMode).toBe("DEMO"); expect(r.results.objective).toHaveLength(10); expect(r.results.speaking).toHaveLength(8);
    expect(r.events.map((e) => e.reason)).toEqual(expect.arrayContaining(["Full mock complete", "Badge unlocked: CELPIP Warrior"]));
    await expect(submitMock(userId, a.id, items)).rejects.toThrow(/already been submitted/);
  });
  it("starts section and custom tests with the right plans", async () => {
    const s = await getMockSession(userId, (await startMock(userId, { kind: "SECTION", skill: "SPEAKING" })).id);
    expect(s.sections).toHaveLength(1); expect(s.sections[0].items).toHaveLength(8);
    const ids = (await prisma.exercise.findMany({ where: { slug: { in: ["W2", "L3", "R4"] } } })).map((e) => e.id);
    const c = await getMockSession(userId, (await startMock(userId, { kind: "CUSTOM", exerciseIds: ids, untimed: true })).id);
    expect(c.sections.map((x) => x.skill)).toEqual(["LISTENING", "READING", "WRITING"]); expect(c.attempt.untimed).toBe(true);
  });
});

describe("dashboard, analytics and isolation", () => {
  it("builds dashboard and analytics from the user's own data only", async () => {
    const d = await dashboardData(userId);
    expect(d.estimates.find((e) => e.skill === "listening")!.level).toBeGreaterThan(0); expect(d.recommendations.length).toBeGreaterThan(0); expect(d.plan.length).toBeGreaterThanOrEqual(3);
    const a = await analyticsData(userId); expect(a.timeline.length).toBeGreaterThan(5); expect(a.mocks).toHaveLength(1);
    const other = await dashboardData(otherId); expect(other.exerciseCount).toBe(0); expect(other.xp).toBe(0);
    const ach = await achievementsData(userId); expect(ach.badges.find((b) => b.key === "celpip-warrior")?.earnedAt).toBeTruthy();
  });
  it("resets progress without deleting the account", async () => {
    await resetProgress(userId);
    expect(await prisma.practiceAttempt.count({ where: { userId } })).toBe(0);
    expect((await prisma.userProfile.findUniqueOrThrow({ where: { userId } })).xp).toBe(0);
    expect(await prisma.user.findUnique({ where: { id: userId } })).toBeTruthy();
  });
});
