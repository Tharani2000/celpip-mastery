import { pct } from "./utils";
import type { ReviewItem } from "./content-types";

export const LEVEL_DESC: Record<number, string> = {
  12: "Advanced proficiency", 11: "Advanced proficiency", 10: "Highly effective proficiency", 9: "Effective proficiency",
  8: "Good proficiency", 7: "Adequate proficiency", 6: "Developing proficiency", 5: "Acquiring proficiency",
  4: "Adequate for some daily life", 3: "Some proficiency in limited contexts", 2: "Minimal proficiency", 1: "Minimal proficiency"
};

/** Approximate conversion from percentage correct to a CELPIP-style level. Practice estimate only, not an official table. */
export function percentToLevel(p: number): number {
  if (p >= 95) return 12; if (p >= 89) return 11; if (p >= 82) return 10; if (p >= 74) return 9; if (p >= 63) return 8;
  if (p >= 52) return 7; if (p >= 40) return 6; if (p >= 30) return 5; if (p >= 20) return 4; return 3;
}

export type ScorableQuestion = { id: string; order: number; text: string; category: string; explanation: string; options: { id: string; label: string; text: string; isCorrect: boolean }[] };

export type ScoreResult = { correct: number; total: number; percent: number; level: number; categories: Record<string, [number, number]>; review: ReviewItem[]; answers: Record<string, string> };

/** Scores answers server-side. Answers referencing unknown questions or options are ignored. */
export function scoreAnswers(questions: ScorableQuestion[], answers: Record<string, string | null | undefined>): ScoreResult {
  const categories: Record<string, [number, number]> = {};
  const clean: Record<string, string> = {};
  let correct = 0;
  const review = [...questions].sort((a, b) => a.order - b.order).map((q) => {
    const chosen = answers[q.id];
    const valid = q.options.some((o) => o.id === chosen) ? (chosen as string) : null;
    if (valid) clean[q.id] = valid;
    const right = q.options.find((o) => o.isCorrect);
    if (!right) throw new Error(`Question ${q.id} has no correct option`);
    const ok = valid === right.id;
    if (ok) correct++;
    const c = (categories[q.category] ??= [0, 0]); c[1]++; if (ok) c[0]++;
    return { id: q.id, order: q.order, text: q.text, category: q.category, options: q.options.map(({ id, label, text }) => ({ id, label, text })), chosenOptionId: valid, correctOptionId: right.id, isCorrect: ok, explanation: q.explanation };
  });
  const total = questions.length; const percent = pct(correct, total);
  return { correct, total, percent, level: percentToLevel(percent), categories, review, answers: clean };
}

export function mergeCategories(list: Record<string, [number, number]>[]): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = {};
  for (const c of list) for (const [k, [r, t]] of Object.entries(c)) { const o = (out[k] ??= [0, 0]); o[0] += r; o[1] += t; }
  return out;
}

/** Overall mock level: rounded mean of available section levels. */
export function overallLevel(levels: (number | null | undefined)[]): number | null {
  const v = levels.filter((x): x is number => typeof x === "number" && x > 0);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}
