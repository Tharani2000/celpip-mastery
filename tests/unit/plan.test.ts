import { describe, expect, it } from "vitest";
import { addDays, DEFAULT_SETTINGS, generatePlan, orderExercises, planProgress, MOCK_MINUTES, type CatalogExercise, type PlanSettings } from "../../src/lib/plan";

// A bank shaped like the real one: 6 listening parts x 5, 4 reading parts x 6, 15 + 15 writing, 8 speaking tasks x 5.
const diffs = ["INTERMEDIATE", "INTERMEDIATE", "ADVANCED", "ADVANCED", "ADVANCED", "ADVANCED"] as const;
const make = (skill: CatalogExercise["skill"], groups: number, per: number): CatalogExercise[] =>
  Array.from({ length: groups }, (_, g) => Array.from({ length: per }, (_, i) => ({ id: `${skill}-${g + 1}-${i}`, skill, group: g + 1, difficulty: diffs[i % 6], slug: `${skill[0]}${g + 1}-${i + 1}`, label: `${skill} ${g + 1}.${i + 1}` }))).flat();
const catalog = [...make("listening", 6, 5), ...make("reading", 4, 6), ...make("writing", 2, 15), ...make("speaking", 8, 5)];
const settings: PlanSettings = { ...DEFAULT_SETTINGS, startDate: "2026-11-09" };
let n = 0; const uid = () => `id${n++}`;

describe("generatePlan", () => {
  const days = generatePlan(catalog, settings, new Set(), uid);
  it("builds the requested number of consecutive dated days", () => {
    expect(days).toHaveLength(30);
    expect(days[0].date).toBe("2026-11-09");
    expect(days[29].date).toBe(addDays("2026-11-09", 29));
  });
  it("places one rest day at the end of each week", () => {
    expect(days.filter((d) => d.rest).map((d) => d.day)).toEqual([7, 14, 21, 28]);
    expect(days.filter((d) => d.rest).every((d) => d.items.length === 0)).toBe(true);
  });
  it("schedules a full mock every sixth active day, with no exercises that day", () => {
    const mocks = days.filter((d) => d.items.some((i) => i.kind === "mock"));
    expect(mocks.length).toBe(4);
    expect(mocks.every((d) => d.items.every((i) => i.kind === "mock" || i.kind === "vocab"))).toBe(true);
    expect(mocks[0].items[0].minutes).toBe(MOCK_MINUTES);
  });
  it("keeps normal days within the daily budget and includes vocabulary", () => {
    for (const d of days.filter((x) => !x.rest && !x.items.some((i) => i.kind === "mock"))) {
      expect(d.items.reduce((m, i) => m + i.minutes, 0)).toBeLessThanOrEqual(settings.dailyMinutes);
      expect(d.items.some((i) => i.kind === "vocab")).toBe(true);
      expect(d.items.some((i) => i.exerciseId)).toBe(true);
    }
  });
  it("uses every skill and never repeats an exercise while fresh ones remain", () => {
    const ex = days.flatMap((d) => d.items).filter((i) => i.exerciseId);
    expect(new Set(ex.map((i) => i.kind))).toEqual(new Set(["listening", "reading", "writing", "speaking"]));
    expect(new Set(ex.map((i) => i.exerciseId)).size).toBe(ex.length);
  });
  it("only schedules chosen skills, and works with none", () => {
    const only = generatePlan(catalog, { ...settings, skills: { listening: true, reading: false, writing: false, speaking: false }, mockEvery: 0 }, new Set(), uid);
    expect(new Set(only.flatMap((d) => d.items).map((i) => i.kind))).toEqual(new Set(["vocab", "listening"]));
    const none = generatePlan(catalog, { ...settings, skills: { listening: false, reading: false, writing: false, speaking: false } }, new Set(), uid);
    expect(none.flatMap((d) => d.items).every((i) => i.kind === "vocab" || i.kind === "mock")).toBe(true);
  });
  it("fits more activities into a longer day", () => {
    const long = generatePlan(catalog, { ...settings, dailyMinutes: 120, mockEvery: 0, restDays: 0 }, new Set(), uid);
    const short = generatePlan(catalog, { ...settings, dailyMinutes: 30, mockEvery: 0, restDays: 0 }, new Set(), uid);
    expect(long[0].items.length).toBeGreaterThan(short[0].items.length);
  });
});

describe("orderExercises", () => {
  const list = make("listening", 6, 5);
  it("gentle: easier exercises first, rotating through the parts", () => {
    const o = orderExercises(list, "gentle", new Set());
    expect(o.slice(0, 6).every((e) => e.difficulty === "INTERMEDIATE")).toBe(true);
    expect(new Set(o.slice(0, 6).map((e) => e.group)).size).toBe(6);
  });
  it("challenge: harder exercises first", () => {
    expect(orderExercises(list, "challenge", new Set())[0].difficulty).toBe("ADVANCED");
  });
  it("puts already-practised exercises last", () => {
    const first = orderExercises(list, "gentle", new Set())[0];
    const o = orderExercises(list, "gentle", new Set([first.id]));
    expect(o[o.length - 1].id).toBe(first.id);
  });
});

describe("planProgress", () => {
  it("counts exercises done by practice and other items by manual tick", () => {
    const days = [{ day: 1, date: "2026-11-09", rest: false, items: [
      { id: "a", kind: "listening" as const, label: "x", minutes: 15, exerciseId: "e1" },
      { id: "b", kind: "vocab" as const, label: "v", minutes: 10, done: true },
      { id: "c", kind: "custom" as const, label: "c", minutes: 5 }
    ] }];
    expect(planProgress(days, new Set(["e1"]))).toEqual({ total: 3, done: 2, percent: 67 });
  });
});
