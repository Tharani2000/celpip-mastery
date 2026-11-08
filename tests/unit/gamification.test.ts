import { describe, it, expect } from "vitest";
import { computeStreak, bestStreak, BADGES, newlyEarned, challengeStatus, challengeFor, type BadgeContext } from "@/lib/gamification";
const d = (s: string) => new Date(`${s}T00:00:00Z`);
describe("streaks", () => {
  it("counts consecutive days ending today or yesterday", () => {
    const days = [d("2026-03-01"), d("2026-03-02"), d("2026-03-03")];
    expect(computeStreak(days, d("2026-03-03"))).toBe(3); expect(computeStreak(days, d("2026-03-04"))).toBe(3); expect(computeStreak(days, d("2026-03-05"))).toBe(0);
  });
  it("finds the best run", () => expect(bestStreak([d("2026-01-01"), d("2026-01-02"), d("2026-01-05"), d("2026-01-06"), d("2026-01-07")])).toBe(3));
});
const ctx = (o: Partial<BadgeContext> = {}): BadgeContext => ({ totalSubmissions: 0, bestPercentBySlug: {}, listeningSlugs: ["L1", "L2"], readingSlugs: ["R1"], writingGrammar10: 0, vocabReviewOrMastered: 0, speakingTasksDone: [], writingLevelsByTask: {}, fullMocks: 0, perfectDays: 0, bestStreak: 0, ...o });
describe("badges", () => {
  it("has the required badges", () => { const names = BADGES.map((b) => b.name); for (const n of ["Listening Master", "Reading Champion", "Grammar Guru", "Vocabulary Explorer", "Speaking Superstar", "Writing Expert", "CELPIP Warrior", "Perfect Practice Day"]) expect(names).toContain(n); });
  it("awards only newly earned badges", () => {
    const c = ctx({ totalSubmissions: 1, bestPercentBySlug: { L1: 95, L2: 90, R1: 80 } });
    expect(newlyEarned(c, new Set()).map((b) => b.key)).toEqual(["first-steps", "listening-master"]);
    expect(newlyEarned(c, new Set(["first-steps"])).map((b) => b.key)).toEqual(["listening-master"]);
  });
  it("requires both writing tasks for Writing Expert", () => { const b = BADGES.find((x) => x.key === "writing-expert")!; expect(b.test(ctx({ writingLevelsByTask: { 1: [10] } }))).toBe(false); expect(b.test(ctx({ writingLevelsByTask: { 1: [10], 2: [11] } }))).toBe(true); });
  it("reports progress", () => expect(BADGES.find((b) => b.key === "speaking-superstar")!.progress!(ctx({ speakingTasksDone: [1, 1, 2] }))).toBe("2 of 8"));
});
describe("daily challenges", () => {
  const base = { attempts: [], writingWordCounts: [], speakingCount: 0, vocabReviews: 0, skills: [] };
  it("checks score challenges by skill and task type", () => {
    const ch = { id: "x", text: "", skill: "reading" as const, kind: "score" as const, target: 85, taskType: "Reading for Viewpoints" };
    expect(challengeStatus(ch, { ...base, attempts: [{ skill: "READING", taskType: "Reading Correspondence", percent: 100, categories: {} }] }).done).toBe(false);
    expect(challengeStatus(ch, { ...base, attempts: [{ skill: "READING", taskType: "Reading for Viewpoints", percent: 86, categories: {} }] }).done).toBe(true);
  });
  it("checks category, writing range and skill count", () => {
    expect(challengeStatus({ id: "c", text: "", skill: "reading", kind: "category", category: "inference" }, { ...base, attempts: [{ skill: "READING", taskType: "x", percent: 50, categories: { inference: [2, 2] } }] }).done).toBe(true);
    expect(challengeStatus({ id: "w", text: "", skill: "writing", kind: "submit" }, { ...base, writingWordCounts: [149, 201] }).done).toBe(false);
    expect(challengeStatus({ id: "s", text: "", skill: "any", kind: "skills", target: 2 }, { ...base, skills: ["LISTENING", "READING"] }).done).toBe(true);
  });
  it("rotates deterministically by date", () => { const list = [{ id: "a" }, { id: "b" }] as never[]; expect(challengeFor(list, d("2026-01-01"))).not.toBe(challengeFor(list, d("2026-01-02"))); });
});
