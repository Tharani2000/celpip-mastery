import { generateJson, aiNotice, AIError } from "./provider";
import { writingEvalSchema, speakingEvalSchema, recommendationSchema, mockBatchSchema, type WritingEvaluation, type SpeakingEvaluation, type AIRecommendation } from "./schemas";
import { demoWriting, demoSpeaking } from "./demo";
import { analyzeText } from "../text-analysis";
import { wordCount } from "../utils";
import type { WritingConfig, SpeakingConfig } from "../content-types";

export type EvalOptions = { forceDemo?: boolean; fetcher?: typeof fetch };

export function writingPrompt(cfg: WritingConfig, text: string): string {
  return `Evaluate this CELPIP General Writing practice response from an advanced learner targeting CELPIP 9–12. Levels run 1–12. Be calibrated and strict: a response under 100 words cannot exceed level 6; an off-topic response cannot exceed level 5; reserve 12 for near-flawless, sophisticated, fully developed writing.

TASK ${cfg.task} (${cfg.kind === "email" ? "Writing an Email" : "Responding to Survey Questions"}), expected ${cfg.min}–${cfg.max} words.
Prompt: ${cfg.prompt}
${cfg.points ? "Required points:\n- " + cfg.points.join("\n- ") : "Options:\n- " + (cfg.options ?? []).join("\n- ")}
${cfg.register ? "Expected register: " + cfg.register : ""}

RESPONSE (${wordCount(text)} words):
"""${text}"""

Return JSON exactly in this shape:
{"level":10,"scores":{"content":10,"coherence":10,"vocabulary":10,"grammar":10,"clarity":10,"tone":10},"summary":"2–3 sentences","strengths":["..."],"weaknesses":["..."],"grammarCorrections":[{"original":"exact quote","corrected":"fix","explanation":"why"}],"vocabularySuggestions":[{"original":"phrase","suggestion":"better","why":"why"}],"restructuring":[{"original":"exact sentence","improved":"rewrite"}],"recommendations":["actionable step"],"sampleResponse":"a high-scoring 170–190 word model response to the same task, in Canadian spelling"}
Quote "original" text exactly. At most 6 grammar corrections, 5 vocabulary suggestions, 3 restructurings, 4 recommendations. Use empty arrays when nothing applies.`;
}

export async function evaluateWriting(cfg: WritingConfig, text: string, opts: EvalOptions = {}): Promise<WritingEvaluation> {
  if (opts.forceDemo) return demoWriting(cfg, text, "Demo mode is on in your settings. This is a rule-based estimate, not AI feedback.");
  try { return { ...(await generateJson(writingPrompt(cfg, text), writingEvalSchema, { fetcher: opts.fetcher })), mode: "AI" }; }
  catch (e) { return demoWriting(cfg, text, aiNotice(e)); }
}

export function speakingPrompt(cfg: SpeakingConfig, transcript: string, durationSec: number): string {
  const a = analyzeText(transcript);
  return `Evaluate this CELPIP General Speaking practice response from an advanced learner targeting CELPIP 9–12. Levels run 1–12.
The text is a speech-to-text transcript and may contain recognition errors; don't penalize obvious ones. You cannot hear the audio, so do NOT assess pronunciation, accent or intonation.

Task ${cfg.task}. Preparation ${cfg.prep}s, speaking time ${cfg.speak}s. The learner spoke for about ${Math.round(durationSec)}s.
Prompt: ${cfg.prompt}
${cfg.choices ? "Options: " + cfg.choices.map((c) => `${c.name} (${c.details.join(", ")})`).join(" vs ") : ""}
${cfg.image ? "The learner was shown a picture; judge relevance by plausibility." : ""}
Measured locally: ${a.words} words, ${a.fillerTotal} filler words, connectors: ${a.connectors.join(", ") || "none"}.

TRANSCRIPT:
"""${transcript}"""

Return JSON exactly in this shape:
{"level":9,"scores":{"fluency":9,"vocabulary":9,"grammar":9,"coherence":9,"relevance":9,"development":9},"summary":"2–3 sentences","strengths":["..."],"weaknesses":["..."],"grammarMistakes":[{"original":"quote","corrected":"fix","explanation":"why"}],"betterAlternatives":[{"original":"phrase","better":"more natural phrasing"}],"fluencyTips":["tip"],"modelResponse":"a high-scoring answer that fits in ${cfg.speak} seconds (about ${cfg.speak >= 90 ? 200 : 140} words)"}
Fluency means flow and pacing inferred from the transcript and duration only.`;
}

export async function evaluateSpeaking(cfg: SpeakingConfig, transcript: string, durationSec: number, opts: EvalOptions = {}): Promise<SpeakingEvaluation> {
  const a = analyzeText(transcript);
  const local = { words: a.words, wordsPerMinute: Math.round(a.words / (Math.max(durationSec, 10) / 60)), fillers: a.fillers, fillerTotal: a.fillerTotal, repeated: a.repeated };
  const pronunciation = { assessed: false as const, note: "Pronunciation isn’t assessed: it needs acoustic analysis, which a transcript can’t provide." };
  if (opts.forceDemo) return demoSpeaking(cfg, transcript, durationSec, "Demo mode is on in your settings. This is a rule-based estimate, not AI feedback.");
  try { return { ...(await generateJson(speakingPrompt(cfg, transcript, durationSec), speakingEvalSchema, { fetcher: opts.fetcher })), mode: "AI", local, pronunciation }; }
  catch (e) { return demoSpeaking(cfg, transcript, durationSec, aiNotice(e)); }
}

export async function aiStudyPlan(summary: string, opts: EvalOptions = {}): Promise<AIRecommendation | null> {
  if (opts.forceDemo) return null;
  const prompt = `Build today's personalized CELPIP study plan.\n${summary}\nAvailable activities: listening parts 1–6, reading parts 1–4, writing task 1 (email) and task 2 (survey), speaking tasks 1–8, vocabulary flashcards, mock tests.\nReturn JSON: {"focus":"one sentence","plan":[{"skill":"listening|reading|writing|speaking|vocabulary|mock","activity":"specific activity","minutes":10,"why":"short reason"}]} with 3–5 items whose minutes sum to roughly the daily study time.`;
  try { return await generateJson(prompt, recommendationSchema, { maxTokens: 800, fetcher: opts.fetcher }); } catch { return null; }
}

export type BatchItem = { id: string; kind: "writing" | "speaking"; prompt: string; response: string; meta: string };
export async function evaluateMockBatch(items: BatchItem[], opts: EvalOptions = {}) {
  if (!items.length) return null;
  if (opts.forceDemo) throw new AIError("not_configured", "Demo mode");
  const prompt = `Score an unofficial CELPIP General mock test for an advanced learner. Levels run 1–12; be calibrated and strict. Speaking items are speech-to-text transcripts: ignore obvious recognition errors and never assess pronunciation. Blank or empty responses get level 1–3.
${items.map((i) => `\n${i.kind.toUpperCase()} ${i.id} (${i.meta}): ${i.prompt}\nResponse: """${i.response || "(blank)"}"""`).join("\n")}

Return JSON: {"writing":[{"id":"...","level":9,"comment":"2 sentences: main strength and most important fix"}],"speaking":[{"id":"...","level":9,"comment":"2 sentences"}]} including every item above.`;
  return generateJson(prompt, mockBatchSchema, { maxTokens: 2000, fetcher: opts.fetcher });
}
