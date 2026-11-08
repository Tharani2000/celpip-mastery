import { describe, it, expect } from "vitest";
import { review, initialSrs, intervalLabel } from "@/lib/srs";
const now = new Date("2026-01-01T12:00:00Z");
describe("spaced repetition", () => {
  it("moves a new card into learning", () => { const s = review(null, 2, now); expect(s.status).toBe("LEARNING"); expect(s.intervalDays).toBe(1); expect(s.dueAt.getTime() - now.getTime()).toBe(86_400_000); });
  it("schedules Again in ten minutes and counts a lapse", () => { const s = review({ ...initialSrs(now), intervalDays: 10, status: "REVIEW" }, 0, now); expect(s.intervalDays).toBe(0); expect(s.lapses).toBe(1); expect(s.dueAt.getTime() - now.getTime()).toBe(600_000); expect(s.status).toBe("LEARNING"); });
  it("grows intervals and reaches review then mastered", () => {
    let s = review(null, 3, now); expect(s.intervalDays).toBe(4); expect(s.status).toBe("REVIEW");
    for (let i = 0; i < 4; i++) s = review(s, 2, now);
    expect(s.intervalDays).toBeGreaterThanOrEqual(21); expect(s.status).toBe("MASTERED");
  });
  it("keeps ease within bounds", () => { let s = review(null, 2, now); for (let i = 0; i < 20; i++) s = review(s, 1, now); expect(s.ease).toBeGreaterThanOrEqual(1.3); for (let i = 0; i < 30; i++) s = review(s, 3, now); expect(s.ease).toBeLessThanOrEqual(3); });
  it("labels intervals", () => { expect(intervalLabel(0)).toBe("10 min"); expect(intervalLabel(0.5)).toBe("12 h"); expect(intervalLabel(1)).toBe("1 day"); expect(intervalLabel(12)).toBe("12 days"); expect(intervalLabel(90)).toBe("3 mo"); });
});
