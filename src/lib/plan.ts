/** Study-plan model and generator. Pure functions only (no database), so it is easy to test. */
export type PlanSkill = "listening" | "reading" | "writing" | "speaking";
export const PLAN_SKILLS: PlanSkill[] = ["listening", "reading", "writing", "speaking"];
export type PlanKind = PlanSkill | "vocab" | "mock" | "custom";
export type PlanLevel = "gentle" | "mixed" | "challenge";

export type PlanItem = {
  id: string; kind: PlanKind; label: string; minutes: number;
  /** Set for listening/reading/writing/speaking items; the exercise to open. */
  exerciseId?: string;
  /** Manual tick, used by vocab, mock and custom items. Exercises complete automatically when practised. */
  done?: boolean;
};
export type PlanDay = { day: number; date: string; rest: boolean; items: PlanItem[] };
export type PlanSettings = {
  startDate: string; days: number; dailyMinutes: number; restDays: number;
  skills: Record<PlanSkill, boolean>; vocab: boolean; mockEvery: number; level: PlanLevel;
};
export type CatalogExercise = { id: string; skill: PlanSkill; group: number; difficulty: "INTERMEDIATE" | "ADVANCED" | "EXPERT"; slug: string; label: string };

export const SKILL_MINUTES: Record<PlanSkill, number> = { listening: 15, reading: 15, writing: 30, speaking: 5 };
export const VOCAB_MINUTES = 10;
export const MOCK_MINUTES = 120;
export const MAX_ITEMS_PER_DAY = 8;

export const DEFAULT_SETTINGS: Omit<PlanSettings, "startDate"> = {
  days: 30, dailyMinutes: 45, restDays: 1, skills: { listening: true, reading: true, writing: true, speaking: true }, vocab: true, mockEvery: 6, level: "gentle"
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const isDateStr = (s: string) => DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}

const RANK = { INTERMEDIATE: 0, ADVANCED: 1, EXPERT: 2 } as const;
const natural = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

/** Orders one skill's exercises for the plan: never-practised first, then by the chosen difficulty ramp, rotating through parts/tasks. */
export function orderExercises(list: CatalogExercise[], level: PlanLevel, attempted: ReadonlySet<string>): CatalogExercise[] {
  const rank = (e: CatalogExercise) => (level === "gentle" ? RANK[e.difficulty] : level === "challenge" ? 2 - RANK[e.difficulty] : 0);
  const base = [...list].sort((a, b) => rank(a) - rank(b) || natural(a.slug, b.slug));
  const seen = new Map<number, number>(); const idx = new Map<string, number>();
  for (const e of base) { const n = seen.get(e.group) ?? 0; idx.set(e.id, n); seen.set(e.group, n + 1); }
  return base.sort((a, b) => Number(attempted.has(a.id)) - Number(attempted.has(b.id)) || rank(a) - rank(b) || idx.get(a.id)! - idx.get(b.id)! || a.group - b.group || natural(a.slug, b.slug));
}

const SKILL_WORD: Record<PlanSkill, string> = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };
export const skillWord = (s: PlanSkill) => SKILL_WORD[s];

export function generatePlan(catalog: CatalogExercise[], s: PlanSettings, attempted: ReadonlySet<string> = new Set(), uid: () => string = () => Math.random().toString(36).slice(2, 10)): PlanDay[] {
  const enabled = PLAN_SKILLS.filter((k) => s.skills[k]);
  const queues = new Map(enabled.map((k) => [k, orderExercises(catalog.filter((e) => e.skill === k), s.level, attempted)]));
  const cursor = new Map(enabled.map((k) => [k, 0]));
  const take = (k: PlanSkill): CatalogExercise | undefined => { const q = queues.get(k)!; if (!q.length) return undefined; const i = cursor.get(k)!; cursor.set(k, i + 1); return q[i % q.length]; };
  const item = (e: CatalogExercise): PlanItem => ({ id: uid(), kind: e.skill, label: e.label, minutes: SKILL_MINUTES[e.skill], exerciseId: e.id });

  const days: PlanDay[] = []; let active = 0;
  for (let d = 1; d <= s.days; d++) {
    const date = addDays(s.startDate, d - 1);
    const rest = s.restDays > 0 && (d - 1) % 7 >= 7 - s.restDays;
    if (rest) { days.push({ day: d, date, rest: true, items: [] }); continue; }
    active++;
    const items: PlanItem[] = [];
    if (s.mockEvery > 0 && active % s.mockEvery === 0) {
      items.push({ id: uid(), kind: "mock", label: "Full mock test (all four skills)", minutes: MOCK_MINUTES });
      if (s.vocab) items.push({ id: uid(), kind: "vocab", label: "Review your vocabulary cards", minutes: VOCAB_MINUTES });
      days.push({ day: d, date, rest: false, items }); continue;
    }
    let left = s.dailyMinutes;
    if (s.vocab) { items.push({ id: uid(), kind: "vocab", label: "Review your vocabulary cards", minutes: VOCAB_MINUTES }); left -= VOCAB_MINUTES; }
    // Start each day with a different skill so every skill gets its turn at the front of the day.
    const start = (active - 1) % Math.max(1, enabled.length);
    let added = true; let skillItems = 0;
    while (added && enabled.length && items.length < MAX_ITEMS_PER_DAY) {
      added = false;
      for (let k = 0; k < enabled.length && items.length < MAX_ITEMS_PER_DAY; k++) {
        const sk = enabled[(start + k) % enabled.length];
        if (SKILL_MINUTES[sk] > left && skillItems > 0) continue;
        const e = take(sk); if (!e) continue;
        items.push(item(e)); left -= SKILL_MINUTES[sk]; skillItems++; added = true;
      }
      if (left <= 0) break;
    }
    days.push({ day: d, date, rest: false, items });
  }
  return days;
}

/** Counts items for the progress bar. Exercise items are done when practised since the plan began; the rest use the manual tick. */
export function planProgress(days: PlanDay[], completed: ReadonlySet<string>) {
  let total = 0, done = 0;
  for (const d of days) for (const i of d.items) { total++; if (isItemDone(i, completed)) done++; }
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}
export const isItemDone = (i: PlanItem, completed: ReadonlySet<string>) => (i.exerciseId ? completed.has(i.exerciseId) || !!i.done : !!i.done);
