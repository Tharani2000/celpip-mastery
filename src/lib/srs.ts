import { clamp, DAY_MS } from "./utils";

export type SrsState = { status: "NEW" | "LEARNING" | "REVIEW" | "MASTERED"; intervalDays: number; ease: number; repetitions: number; lapses: number; dueAt: Date };
export type Grade = 0 | 1 | 2 | 3; // again, hard, good, easy

export const initialSrs = (now = new Date()): SrsState => ({ status: "NEW", intervalDays: 0, ease: 2.5, repetitions: 0, lapses: 0, dueAt: now });

/** SM-2-style scheduling. Status follows the interval: <3 days learning, 3–20 review, 21+ mastered. */
export function review(prev: SrsState | null, grade: Grade, now = new Date()): SrsState {
  const p = prev ? { ...prev } : initialSrs(now);
  if (grade === 0) return { ...p, intervalDays: 0, repetitions: 0, lapses: p.lapses + 1, dueAt: new Date(now.getTime() + 10 * 60_000), status: "LEARNING" };
  const repetitions = p.repetitions + 1;
  let intervalDays: number;
  if (!p.intervalDays) intervalDays = grade === 3 ? 4 : grade === 2 ? 1 : 0.5;
  else intervalDays = Math.max(1, Math.round(p.intervalDays * (grade === 1 ? 1.2 : grade === 2 ? p.ease : p.ease * 1.3)));
  const ease = clamp(p.ease + (grade === 1 ? -0.15 : grade === 3 ? 0.1 : 0), 1.3, 3);
  const status = intervalDays >= 21 ? "MASTERED" : intervalDays >= 3 ? "REVIEW" : "LEARNING";
  return { status, intervalDays, ease, repetitions, lapses: p.lapses, dueAt: new Date(now.getTime() + intervalDays * DAY_MS) };
}

export function intervalLabel(days: number): string {
  if (days === 0) return "10 min"; if (days < 1) return "12 h"; if (days === 1) return "1 day";
  return days < 31 ? `${days} days` : `${Math.round(days / 30)} mo`;
}
