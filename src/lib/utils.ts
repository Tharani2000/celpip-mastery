import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
export const pct = (c: number, t: number) => (t ? Math.round((c / t) * 100) : 0);
export const mmss = (s: number) => { const v = Math.max(0, Math.round(s)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`; };
export const wordCount = (t: string) => (String(t || "").trim().match(/[A-Za-z0-9’'-]+/g) || []).length;
export function hashText(s: string): string { let h = 0; const t = s.trim().toLowerCase().replace(/\s+/g, " "); for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return String(h >>> 0); }
export const DAY_MS = 86_400_000;
/** Calendar date (UTC midnight) for a moment in the user's timezone, used as the DailyActivity key. */
export function activityDate(d: Date = new Date(), timeZone = "America/Toronto"): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return new Date(`${parts}T00:00:00.000Z`);
}
export const dateKey = (d: Date) => d.toISOString().slice(0, 10);
