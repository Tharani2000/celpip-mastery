import { describe, it, expect } from "vitest";
import { percentToLevel, scoreAnswers, mergeCategories, overallLevel, type ScorableQuestion } from "@/lib/scoring";

const q = (id: string, order: number, cat: string, correct = 0): ScorableQuestion => ({ id, order, text: `Q${order}`, category: cat, explanation: "because", options: ["a", "b", "c", "d"].map((o, i) => ({ id: `${id}-${o}`, label: o.toUpperCase(), text: o, isCorrect: i === correct })) });

describe("percentToLevel", () => {
  it("maps boundaries monotonically", () => {
    expect(percentToLevel(100)).toBe(12); expect(percentToLevel(95)).toBe(12); expect(percentToLevel(94)).toBe(11);
    expect(percentToLevel(82)).toBe(10); expect(percentToLevel(74)).toBe(9); expect(percentToLevel(0)).toBe(3);
    let prev = 0; for (let p = 0; p <= 100; p++) { const l = percentToLevel(p); expect(l).toBeGreaterThanOrEqual(prev); prev = l; }
  });
});

describe("scoreAnswers", () => {
  const qs = [q("q1", 1, "main"), q("q2", 2, "detail", 2), q("q3", 3, "detail", 1)];
  it("scores correct, wrong and unanswered", () => {
    const r = scoreAnswers(qs, { q1: "q1-a", q2: "q2-a" });
    expect(r.correct).toBe(1); expect(r.total).toBe(3); expect(r.percent).toBe(33);
    expect(r.categories).toEqual({ main: [1, 1], detail: [0, 2] });
    expect(r.review.map((x) => x.isCorrect)).toEqual([true, false, false]);
    expect(r.review[2].chosenOptionId).toBeNull();
  });
  it("ignores options that don't belong to the question", () => {
    const r = scoreAnswers(qs, { q1: "q2-a", q2: "q2-c", bogus: "x" });
    expect(r.correct).toBe(1); expect(r.answers).toEqual({ q2: "q2-c" });
  });
  it("orders review by question order and includes explanations", () => {
    const r = scoreAnswers([qs[2], qs[0], qs[1]], {});
    expect(r.review.map((x) => x.order)).toEqual([1, 2, 3]); expect(r.review[0].explanation).toBe("because");
  });
  it("throws if a question has no correct option", () => {
    const bad = { ...qs[0], options: qs[0].options.map((o) => ({ ...o, isCorrect: false })) };
    expect(() => scoreAnswers([bad], {})).toThrow();
  });
});

describe("helpers", () => {
  it("merges categories", () => expect(mergeCategories([{ a: [1, 2] }, { a: [2, 2], b: [0, 1] }])).toEqual({ a: [3, 4], b: [0, 1] }));
  it("computes overall level from available sections", () => { expect(overallLevel([10, 11, null, undefined])).toBe(11); expect(overallLevel([null])).toBeNull(); expect(overallLevel([9, 10])).toBe(10); });
});
