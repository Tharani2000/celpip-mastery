import { prisma } from "../prisma";
import { review, type Grade, intervalLabel, type SrsState } from "../srs";
import { XP } from "../xp";
import { activityDate, wordCount } from "../utils";
import { logActivity, userTimezone } from "./activity";
import { generateJson, aiConfigured } from "../ai/provider";
import { z } from "zod";
import { NotFoundError } from "./practice";

export async function vocabularyDeck(userId: string) {
  const [words, progress] = await Promise.all([
    prisma.vocabularyWord.findMany({ orderBy: [{ category: "asc" }, { word: "asc" }] }),
    prisma.userVocabularyProgress.findMany({ where: { userId } })
  ]);
  const map = new Map(progress.map((p) => [p.wordId, p]));
  const now = Date.now();
  return words.map((w) => {
    const p = map.get(w.id);
    const state: SrsState | null = p ? { status: p.status, intervalDays: p.intervalDays, ease: p.ease, repetitions: p.repetitions, lapses: p.lapses, dueAt: p.dueAt } : null;
    return { ...w, status: p?.status ?? "NEW", due: !!p && p.status !== "NEW" && p.dueAt.getTime() <= now, dueAt: p?.dueAt ?? null,
      preview: ([0, 1, 2, 3] as Grade[]).map((g) => intervalLabel(review(state, g).intervalDays)) };
  });
}
export type DeckWord = Awaited<ReturnType<typeof vocabularyDeck>>[number];

export async function reviewWord(userId: string, wordId: string, grade: Grade, secondsOnCard: number) {
  const word = await prisma.vocabularyWord.findUnique({ where: { id: wordId } });
  if (!word) throw new NotFoundError("Word not found");
  const prev = await prisma.userVocabularyProgress.findUnique({ where: { userId_wordId: { userId, wordId } } });
  const next = review(prev ? { status: prev.status, intervalDays: prev.intervalDays, ease: prev.ease, repetitions: prev.repetitions, lapses: prev.lapses, dueAt: prev.dueAt } : null, grade);
  await prisma.userVocabularyProgress.upsert({ where: { userId_wordId: { userId, wordId } }, create: { userId, wordId, ...next, lastReviewed: new Date() }, update: { ...next, lastReviewed: new Date() } });
  const tz = await userTimezone(userId);
  const day = await prisma.dailyActivity.findUnique({ where: { userId_date: { userId, date: activityDate(new Date(), tz) } } });
  const xp = secondsOnCard >= 3 && (day?.vocabXp ?? 0) < XP.vocabDailyCap ? XP.vocabCard : 0;
  const events = await logActivity(userId, { seconds: Math.min(60, secondsOnCard), skill: "vocabulary", vocabReviews: 1, vocabXp: xp, xp: [{ xp, reason: "Flashcard reviewed" }] });
  return { status: next.status, dueAt: next.dueAt, events };
}

export async function recordQuiz(userId: string, correct: number, total: number, durationSec: number) {
  const tz = await userTimezone(userId);
  const day = await prisma.dailyActivity.findUnique({ where: { userId_date: { userId, date: activityDate(new Date(), tz) } } });
  const xp = (day?.quizzes ?? 0) < 2 && durationSec >= 40 ? Math.min(correct, total) : 0;
  return logActivity(userId, { seconds: durationSec, skill: "vocabulary", quiz: true, xp: [{ xp, reason: "Vocabulary quiz" }] });
}

const sentenceFeedback = z.object({ correct: z.boolean(), feedback: z.string().transform((s) => s.slice(0, 400)), improved: z.string().default("").transform((s) => s.slice(0, 300)) });
export async function wordChallenge(userId: string, wordId: string, sentence: string) {
  const w = await prisma.vocabularyWord.findUnique({ where: { id: wordId } });
  if (!w) throw new NotFoundError("Word not found");
  const head = w.word.split(" ")[0].toLowerCase().replace(/[’']/g, ""); const stem = head.slice(0, Math.max(4, head.length - 2));
  const s = sentence.toLowerCase().replace(/[’']/g, "");
  const uses = s.includes(stem) && (w.word.split(" ").length === 1 || s.includes(w.word.split(" ").slice(-1)[0].toLowerCase()));
  if (wordCount(sentence) < 8 || !uses) return { ok: false, feedback: `Use “${w.word}” in a sentence of at least eight words.`, events: [] };
  let feedback = "You used the word in a full sentence. Compare it with the example: is your context as natural?"; let improved = ""; let mode: "AI" | "DEMO" = "DEMO";
  const demo = (await prisma.userProfile.findUnique({ where: { userId }, select: { aiMode: true } }))?.aiMode === "demo";
  if (aiConfigured() && !demo) {
    try { const r = await generateJson(`A CELPIP learner wrote a sentence using "${w.word}" (${w.meaning}). Sentence: """${sentence}"""\nReturn JSON: {"correct":true,"feedback":"one or two sentences on meaning, grammar and naturalness","improved":"a more natural or advanced version"}`, sentenceFeedback, { maxTokens: 400 }); feedback = r.feedback; improved = r.improved; mode = "AI"; } catch { /* keep demo feedback */ }
  }
  const tz = await userTimezone(userId);
  const day = await prisma.dailyActivity.findUnique({ where: { userId_date: { userId, date: activityDate(new Date(), tz) } } });
  const events = await logActivity(userId, { seconds: 60, skill: "vocabulary", wordChallenge: true, xp: [{ xp: day?.wordChallengeDone ? 0 : XP.wordChallenge, reason: "Daily word challenge" }] });
  return { ok: true, feedback, improved, mode, events };
}
