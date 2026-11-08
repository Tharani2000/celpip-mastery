import { mmss } from "./utils";

export const XP = { challenge: 25, badgeDefault: 50, fullMock: 150, sectionMock: 40, customMock: 30, wordChallenge: 10, vocabCard: 2, vocabDailyCap: 40 } as const;

export type ObjectiveXpInput = { percent: number; durationSec: number; total: number; previousPercents: number[]; todayPercents: number[]; fromMock?: boolean };
export type XpResult = { xp: number; messages: string[] };

/** Minimum time for an objective exercise to count, so rushed clicking earns nothing. */
export const minObjectiveSeconds = (total: number) => Math.max(45, total * 15);

export function objectiveXp(i: ObjectiveXpInput): XpResult {
  const min = minObjectiveSeconds(i.total);
  if (i.durationSec < min) return { xp: 0, messages: [`No XP: finished in ${mmss(i.durationSec)}. Spend at least ${mmss(min)} so the practice counts.`] };
  const todayBest = i.todayPercents.length ? Math.max(...i.todayPercents) : -1;
  if (i.todayPercents.length && i.percent <= todayBest) return { xp: 0, messages: ["Repeat attempt today with no improvement, so no XP. Review the explanations, then try a different exercise."] };
  let xp = Math.round(10 + i.percent * 0.4);
  if (i.fromMock) xp = Math.round(xp * 0.5);
  const messages: string[] = [];
  const prevBest = i.previousPercents.length ? Math.max(...i.previousPercents) : -1;
  if (prevBest >= 0 && i.percent > prevBest) { xp += 10; messages.push("New personal best on this exercise."); }
  return { xp, messages };
}

export function writingXp(i: { words: number; durationSec: number; isDuplicate: boolean; level: number }): XpResult {
  if (i.isDuplicate) return { xp: 0, messages: ["This response matches an earlier submission, so no XP was awarded."] };
  if (i.durationSec < 180) return { xp: 0, messages: ["Submitted in under three minutes, so no XP was awarded. Take time to plan and proofread."] };
  if (i.words < 120 || i.words > 260) return { xp: 0, messages: [`No XP for responses outside 120–260 words (yours: ${i.words}).`] };
  return { xp: 30 + (i.level >= 10 ? 10 : 0), messages: [] };
}

export function speakingXp(i: { words: number; durationSec: number; speakSeconds: number; isDuplicate: boolean; level: number }): XpResult {
  if (i.isDuplicate) return { xp: 0, messages: ["This transcript matches an earlier one, so no XP was awarded."] };
  if (i.words < 40 || i.durationSec < i.speakSeconds * 0.5) return { xp: 0, messages: ["Speak for at least half the time (and 40+ words) to earn XP."] };
  return { xp: 20 + (i.level >= 10 ? 10 : 0), messages: [] };
}

export function streakXp(streakDays: number): number { return streakDays > 1 ? Math.min(50, streakDays * 5) : 0; }

export function mockXp(kind: "FULL" | "SECTION" | "CUSTOM", answeredRatio: number): number {
  if (answeredRatio < 0.5) return 0;
  return kind === "FULL" ? XP.fullMock : kind === "SECTION" ? XP.sectionMock : XP.customMock;
}

/** Level curve: level n needs 100 + 60(n-1) XP. */
export function levelFromXp(xp: number) {
  let lvl = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; lvl++; need = 100 + (lvl - 1) * 60; }
  return { level: lvl, into: xp - acc, need };
}
