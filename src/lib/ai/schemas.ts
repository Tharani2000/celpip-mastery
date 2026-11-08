import { z } from "zod";

const level = z.coerce.number().transform((n) => Math.min(12, Math.max(1, Math.round(n))));
const str = (max: number) => z.string().transform((s) => s.slice(0, max));
const strList = (n: number) => z.array(z.string()).default([]).transform((a) => a.filter((s) => s.trim()).slice(0, n).map((s) => s.slice(0, 400)));
const pairList = <K extends string>(keys: readonly K[], n: number) =>
  z.array(z.object(Object.fromEntries(keys.map((k) => [k, z.string().default("")])) as Record<K, z.ZodDefault<z.ZodString>>)).default([]).transform((a) => a.slice(0, n));

export const writingEvalSchema = z.object({
  level,
  scores: z.object({ content: level, coherence: level, vocabulary: level, grammar: level, clarity: level, tone: level }),
  summary: str(800).default(""),
  strengths: strList(6), weaknesses: strList(6),
  grammarCorrections: pairList(["original", "corrected", "explanation"] as const, 8),
  vocabularySuggestions: pairList(["original", "suggestion", "why"] as const, 6),
  restructuring: pairList(["original", "improved"] as const, 4),
  recommendations: strList(5),
  sampleResponse: str(2500).default("")
});
export type WritingEvaluation = z.infer<typeof writingEvalSchema> & { mode: "AI" | "DEMO"; notice?: string };

export const speakingEvalSchema = z.object({
  level,
  scores: z.object({ fluency: level, vocabulary: level, grammar: level, coherence: level, relevance: level, development: level }),
  summary: str(800).default(""),
  strengths: strList(6), weaknesses: strList(6),
  grammarMistakes: pairList(["original", "corrected", "explanation"] as const, 6),
  betterAlternatives: pairList(["original", "better"] as const, 6),
  fluencyTips: strList(5),
  modelResponse: str(2000).default("")
});
export type SpeakingEvaluation = z.infer<typeof speakingEvalSchema> & {
  mode: "AI" | "DEMO"; notice?: string;
  local: { words: number; wordsPerMinute: number; fillers: { word: string; count: number }[]; fillerTotal: number; repeated: { word: string; count: number }[] };
  pronunciation: { assessed: false; note: string };
};

export const recommendationSchema = z.object({
  focus: str(300),
  plan: z.array(z.object({ skill: z.string(), activity: str(160), minutes: z.coerce.number().transform((m) => Math.min(120, Math.max(1, Math.round(m)))), why: str(240) })).min(1).transform((a) => a.slice(0, 6))
});
export type AIRecommendation = z.infer<typeof recommendationSchema>;

export const mockBatchSchema = z.object({
  writing: z.array(z.object({ id: z.string(), level, comment: str(500).default("") })).default([]),
  speaking: z.array(z.object({ id: z.string(), level, comment: str(500).default("") })).default([])
});
