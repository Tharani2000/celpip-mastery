export type SkillKey = "listening" | "reading" | "writing" | "speaking";
export const SKILLS: SkillKey[] = ["listening", "reading", "writing", "speaking"];
export const SKILL_ENUM = { listening: "LISTENING", reading: "READING", writing: "WRITING", speaking: "SPEAKING" } as const;
export const SKILL_NAME: Record<SkillKey, string> = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };
export const toSkillKey = (s: string) => s.toLowerCase() as SkillKey;

export type ListeningScript = { speakers: Record<string, { name: string; voice: "m" | "f" | "f2" }>; lines: [string, string][] };
export type ReadingPassage = {
  paragraphs: string[]; labeled?: boolean; instructions?: string; comment?: string;
  diagram?: { caption: string; headers: string[]; rows: string[][] };
};
export type WritingConfig = { task: 1 | 2; kind: "email" | "survey"; minutes: number; min: number; max: number; prompt: string; points?: string[]; options?: string[]; register?: string };
export type SpeakingConfig = { task: number; prep: number; speak: number; prompt: string; image?: string; choices?: { name: string; details: string[] }[] };

/** Question as sent to the browser: never includes the correct answer or explanation. */
export type PublicQuestion = { id: string; order: number; text: string; category: string; options: { id: string; label: string; text: string }[] };
export type ReviewItem = PublicQuestion & { chosenOptionId: string | null; correctOptionId: string; isCorrect: boolean; explanation: string };

export const CATEGORY_NAME: Record<string, string> = {
  main: "Main idea", detail: "Specific detail", intention: "Speaker or author intention", implied: "Implied meaning",
  attitude: "Attitude and tone", inference: "Inference", opinion: "Opinions and viewpoints", vocabulary: "Vocabulary in context",
  tone: "Tone and perspective", evidence: "Supporting evidence", "fact-opinion": "Fact versus opinion"
};
export const shortType = (t: string) => t.replace(/^(Listening|Reading) (to (a |an )?|for )?/, "").replace(/^./, (c) => c.toUpperCase());
