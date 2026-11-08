import { describe, it, expect } from "vitest";
import { objectiveXp, writingXp, speakingXp, streakXp, mockXp, levelFromXp, minObjectiveSeconds } from "@/lib/xp";

describe("objectiveXp", () => {
  const base = { percent: 80, durationSec: 300, total: 6, previousPercents: [], todayPercents: [] };
  it("awards XP scaled by score", () => expect(objectiveXp(base).xp).toBe(42));
  it("gives nothing for rushed attempts", () => { const r = objectiveXp({ ...base, durationSec: minObjectiveSeconds(6) - 1 }); expect(r.xp).toBe(0); expect(r.messages[0]).toMatch(/No XP/); });
  it("gives nothing for a same-day repeat without improvement", () => expect(objectiveXp({ ...base, previousPercents: [80], todayPercents: [80] }).xp).toBe(0));
  it("rewards a same-day repeat that improves", () => expect(objectiveXp({ ...base, percent: 100, previousPercents: [80], todayPercents: [80] }).xp).toBe(60));
  it("adds a personal-best bonus", () => { const r = objectiveXp({ ...base, previousPercents: [50] }); expect(r.xp).toBe(52); expect(r.messages).toContain("New personal best on this exercise."); });
  it("halves XP inside mocks", () => expect(objectiveXp({ ...base, fromMock: true }).xp).toBe(21));
});
describe("writing and speaking XP", () => {
  it("rejects duplicates, rushed and out-of-range writing", () => {
    expect(writingXp({ words: 170, durationSec: 900, isDuplicate: true, level: 9 }).xp).toBe(0);
    expect(writingXp({ words: 170, durationSec: 100, isDuplicate: false, level: 9 }).xp).toBe(0);
    expect(writingXp({ words: 90, durationSec: 900, isDuplicate: false, level: 9 }).xp).toBe(0);
    expect(writingXp({ words: 170, durationSec: 900, isDuplicate: false, level: 9 }).xp).toBe(30);
    expect(writingXp({ words: 170, durationSec: 900, isDuplicate: false, level: 11 }).xp).toBe(40);
  });
  it("requires enough speech", () => {
    expect(speakingXp({ words: 30, durationSec: 60, speakSeconds: 60, isDuplicate: false, level: 9 }).xp).toBe(0);
    expect(speakingXp({ words: 120, durationSec: 20, speakSeconds: 60, isDuplicate: false, level: 9 }).xp).toBe(0);
    expect(speakingXp({ words: 120, durationSec: 55, speakSeconds: 60, isDuplicate: false, level: 10 }).xp).toBe(30);
  });
});
describe("streaks, mocks and levels", () => {
  it("caps streak XP", () => { expect(streakXp(1)).toBe(0); expect(streakXp(3)).toBe(15); expect(streakXp(30)).toBe(50); });
  it("pays mocks only when engaged", () => { expect(mockXp("FULL", 0.4)).toBe(0); expect(mockXp("FULL", 0.9)).toBe(150); expect(mockXp("SECTION", 1)).toBe(40); });
  it("computes the level curve", () => { expect(levelFromXp(0)).toEqual({ level: 1, into: 0, need: 100 }); expect(levelFromXp(100)).toEqual({ level: 2, into: 0, need: 160 }); expect(levelFromXp(259).level).toBe(2); expect(levelFromXp(260).level).toBe(3); });
});
