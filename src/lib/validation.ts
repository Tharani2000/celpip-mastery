import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(160),
  password: z.string().min(8, "Use at least 8 characters").max(128)
});
export const attemptSchema = z.object({
  exerciseId: z.string().min(1).max(40),
  answers: z.record(z.string().max(40), z.string().max(40).nullable()).refine((r) => Object.keys(r).length <= 60, "Too many answers"),
  durationSec: z.number().int().min(0).max(4 * 3600)
});
export const writingDraftSchema = z.object({ exerciseId: z.string().min(1).max(40), text: z.string().max(12000) });
export const writingSubmitSchema = writingDraftSchema.extend({ durationSec: z.number().int().min(0).max(4 * 3600) });
export const speakingFieldsSchema = z.object({
  exerciseId: z.string().min(1).max(40),
  transcript: z.string().max(8000).default(""),
  transcriptSource: z.enum(["browser", "typed"]).default("browser"),
  durationSec: z.coerce.number().min(0).max(600)
});
export const vocabReviewSchema = z.object({ wordId: z.string().min(1).max(40), grade: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]), secondsOnCard: z.number().min(0).max(600) });
export const vocabQuizSchema = z.object({ correct: z.number().int().min(0).max(20), total: z.number().int().min(1).max(20), durationSec: z.number().min(0).max(3600) });
export const wordChallengeSchema = z.object({ wordId: z.string().min(1).max(40), sentence: z.string().trim().min(1).max(600) });
export const profileSchema = z.object({
  displayName: z.string().trim().max(60).optional(),
  targetScore: z.number().int().min(4).max(12).optional(),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  dailyMinutes: z.number().int().min(10).max(240).optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
  ttsRate: z.number().min(0.7).max(1.3).optional(),
  aiMode: z.enum(["auto", "demo"]).optional()
});
export const mockStartSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("FULL") }),
  z.object({ kind: z.literal("SECTION"), skill: z.enum(["LISTENING", "READING", "WRITING", "SPEAKING"]) }),
  z.object({ kind: z.literal("CUSTOM"), exerciseIds: z.array(z.string().max(40)).min(1).max(30), untimed: z.boolean().default(false) })
]);
export const mockItemResultSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("objective"), exerciseId: z.string().max(40), answers: z.record(z.string().max(40), z.string().max(40).nullable()), durationSec: z.number().min(0).max(4 * 3600) }),
  z.object({ type: z.literal("writing"), exerciseId: z.string().max(40), text: z.string().max(12000), durationSec: z.number().min(0).max(4 * 3600) }),
  z.object({ type: z.literal("speaking"), exerciseId: z.string().max(40), transcript: z.string().max(8000), durationSec: z.number().min(0).max(600), submissionId: z.string().max(40).optional() })
]);
export const mockSubmitSchema = z.object({ items: z.array(mockItemResultSchema).min(1).max(40) });
export type MockItemResult = z.infer<typeof mockItemResultSchema>;

// ---- Study plan ----
export const planSettingsSchema = z.object({
  startDate: z.string().refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), "Choose a valid start date"),
  days: z.number().int().min(7).max(60).default(30),
  dailyMinutes: z.number().int().min(15).max(240),
  restDays: z.number().int().min(0).max(3),
  skills: z.object({ listening: z.boolean(), reading: z.boolean(), writing: z.boolean(), speaking: z.boolean() }),
  vocab: z.boolean(),
  mockEvery: z.number().int().min(0).max(14),
  level: z.enum(["gentle", "mixed", "challenge"])
});
export const planDaysSchema = z.array(z.object({
  day: z.number().int().min(1).max(60),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rest: z.boolean(),
  items: z.array(z.object({
    id: z.string().min(1).max(40),
    kind: z.enum(["listening", "reading", "writing", "speaking", "vocab", "mock", "custom"]),
    label: z.string().trim().min(1, "Give each activity a name").max(140),
    minutes: z.number().int().min(0).max(300),
    exerciseId: z.string().min(1).max(40).optional(),
    done: z.boolean().optional()
  })).max(12, "That is too many activities for one day")
})).min(1).max(60);
