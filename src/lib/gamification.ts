import { DAY_MS, dateKey } from "./utils";

/** Consecutive active days ending today (or yesterday, so the streak survives until the day ends). */
export function computeStreak(activeDates: Date[], today: Date): number {
  const set = new Set(activeDates.map(dateKey));
  let d = new Date(today);
  if (!set.has(dateKey(d))) d = new Date(d.getTime() - DAY_MS);
  let n = 0;
  while (set.has(dateKey(d))) { n++; d = new Date(d.getTime() - DAY_MS); }
  return n;
}
export function bestStreak(activeDates: Date[]): number {
  const days = [...new Set(activeDates.map(dateKey))].sort();
  let best = 0, run = 0, prev: number | null = null;
  for (const k of days) { const t = new Date(k + "T00:00:00Z").getTime(); run = prev !== null && Math.round((t - prev) / DAY_MS) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; }
  return best;
}

export type BadgeContext = {
  totalSubmissions: number;
  bestPercentBySlug: Record<string, number>;
  listeningSlugs: string[]; readingSlugs: string[];
  writingGrammar10: number; vocabReviewOrMastered: number;
  speakingTasksDone: number[]; writingLevelsByTask: Record<number, number[]>;
  fullMocks: number; perfectDays: number; bestStreak: number;
};
export type BadgeDef = { key: string; name: string; description: string; icon: string; xpReward: number; test: (c: BadgeContext) => boolean; progress?: (c: BadgeContext) => string };
const allAbove = (slugs: string[], c: BadgeContext, p: number) => slugs.length > 0 && slugs.every((s) => (c.bestPercentBySlug[s] ?? -1) >= p);
const countAbove = (slugs: string[], c: BadgeContext, p: number) => slugs.filter((s) => (c.bestPercentBySlug[s] ?? -1) >= p).length;
export const BADGES: BadgeDef[] = [
  { key: "first-steps", name: "First Steps", description: "Complete your first exercise.", icon: "Star", xpReward: 50, test: (c) => c.totalSubmissions >= 1 },
  { key: "listening-master", name: "Listening Master", description: "Score 90% or higher on every listening part.", icon: "Headphones", xpReward: 50, test: (c) => allAbove(c.listeningSlugs, c, 90), progress: (c) => `${countAbove(c.listeningSlugs, c, 90)} of ${c.listeningSlugs.length}` },
  { key: "reading-champion", name: "Reading Champion", description: "Score 90% or higher on every reading part.", icon: "BookOpen", xpReward: 50, test: (c) => allAbove(c.readingSlugs, c, 90), progress: (c) => `${countAbove(c.readingSlugs, c, 90)} of ${c.readingSlugs.length}` },
  { key: "grammar-guru", name: "Grammar Guru", description: "Earn a grammar rating of 10+ on three writing responses.", icon: "SpellCheck", xpReward: 50, test: (c) => c.writingGrammar10 >= 3, progress: (c) => `${Math.min(3, c.writingGrammar10)} of 3` },
  { key: "vocabulary-explorer", name: "Vocabulary Explorer", description: "Move 25 words into Review or Mastered.", icon: "Layers", xpReward: 50, test: (c) => c.vocabReviewOrMastered >= 25, progress: (c) => `${Math.min(25, c.vocabReviewOrMastered)} of 25` },
  { key: "speaking-superstar", name: "Speaking Superstar", description: "Submit responses to all eight speaking task types.", icon: "Mic", xpReward: 50, test: (c) => new Set(c.speakingTasksDone).size >= 8, progress: (c) => `${new Set(c.speakingTasksDone).size} of 8` },
  { key: "writing-expert", name: "Writing Expert", description: "Reach an estimated level 10+ on both writing tasks.", icon: "PenLine", xpReward: 50, test: (c) => [1, 2].every((t) => (c.writingLevelsByTask[t] ?? []).some((l) => l >= 10)) },
  { key: "celpip-warrior", name: "CELPIP Warrior", description: "Finish a full mock test.", icon: "Swords", xpReward: 100, test: (c) => c.fullMocks >= 1 },
  { key: "perfect-practice-day", name: "Perfect Practice Day", description: "Practise all four skills and meet your daily goal in one day.", icon: "Sparkles", xpReward: 50, test: (c) => c.perfectDays >= 1 },
  { key: "seven-day-streak", name: "Seven-Day Streak", description: "Practise seven days in a row.", icon: "Flame", xpReward: 50, test: (c) => c.bestStreak >= 7, progress: (c) => `${Math.min(7, c.bestStreak)} of 7` }
];
export const newlyEarned = (ctx: BadgeContext, earnedKeys: Set<string>) => BADGES.filter((b) => !earnedKeys.has(b.key) && b.test(ctx));

export type ChallengeDef = { id: string; text: string; skill: "listening" | "reading" | "writing" | "speaking" | "vocabulary" | "any"; kind: "score" | "category" | "submit" | "count" | "vocab" | "skills"; target?: number; category?: string; taskType?: string };
export type ChallengeContext = {
  attempts: { skill: string; taskType: string; percent: number; categories: Record<string, [number, number]> }[];
  writingWordCounts: number[]; speakingCount: number; vocabReviews: number; skills: string[];
};
export function dayIndex(d: Date): number { return Math.floor(d.getTime() / 86_400_000); }
export function challengeFor(list: ChallengeDef[], date: Date): ChallengeDef { return list[dayIndex(date) % list.length]; }
export function challengeStatus(ch: ChallengeDef, c: ChallengeContext): { done: boolean; progress: string } {
  const sk = ch.skill.toUpperCase();
  switch (ch.kind) {
    case "score": { const pool = c.attempts.filter((a) => a.skill === sk && (!ch.taskType || a.taskType === ch.taskType)); return { done: pool.some((a) => a.percent >= (ch.target ?? 90)), progress: pool.length ? `Best today: ${Math.max(...pool.map((a) => a.percent))}%` : "Not attempted yet" }; }
    case "category": { const pool = c.attempts.filter((a) => a.skill === sk && a.categories[ch.category!]); return { done: pool.some((a) => a.categories[ch.category!][0] === a.categories[ch.category!][1]), progress: pool.length ? `Attempted ${pool.length} time(s)` : "Not attempted yet" }; }
    case "submit": { const ok = c.writingWordCounts.some((w) => w >= 150 && w <= 200); return { done: ok, progress: ok ? "Done" : "No qualifying response yet" }; }
    case "count": return { done: c.speakingCount >= (ch.target ?? 2), progress: `${c.speakingCount} of ${ch.target}` };
    case "vocab": return { done: c.vocabReviews >= (ch.target ?? 10), progress: `${c.vocabReviews} of ${ch.target}` };
    case "skills": return { done: new Set(c.skills).size >= (ch.target ?? 2), progress: `${new Set(c.skills).size} of ${ch.target}` };
  }
}
