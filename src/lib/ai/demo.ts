import { analyzeText, grammarHeuristics, BASIC_SWAPS } from "../text-analysis";
import { avg, clamp } from "../utils";
import type { WritingConfig, SpeakingConfig } from "../content-types";
import type { WritingEvaluation, SpeakingEvaluation } from "./schemas";

/** Rule-based writing estimate used when no AI provider is available. Never returns 12. */
export function demoWriting(cfg: WritingConfig, text: string, notice: string): WritingEvaluation {
  const a = analyzeText(text); const wc = a.words; const inRange = wc >= cfg.min && wc <= cfg.max; const low = text.toLowerCase();
  const gram = grammarHeuristics(text);
  let content = 5 + (inRange ? 3 : wc >= 120 ? 2 : wc >= 80 ? 1 : 0) + (a.paragraphs >= 3 ? 1 : 0);
  content += cfg.kind === "survey" ? (/option a|option b|\bi (prefer|choose|support|believe)/.test(low) ? 1 : -1) : /^(dear|hello|hi)\b/m.test(low) ? 1 : 0;
  const scores = {
    content, coherence: 4 + Math.min(4, Math.round(a.connectors.length / 1.5)) + (a.paragraphs >= 3 ? 2 : a.paragraphs >= 2 ? 1 : 0),
    vocabulary: 4 + (a.typeTokenRatio > 0.62 ? 3 : a.typeTokenRatio > 0.52 ? 2 : 1) + (a.longWordRatio > 0.14 ? 3 : a.longWordRatio > 0.09 ? 2 : 1),
    grammar: 10 - gram.length, clarity: a.avgSentenceLength >= 11 && a.avgSentenceLength <= 24 ? 9 : a.avgSentenceLength > 30 ? 6 : 7,
    tone: cfg.kind === "email" ? (/(regards|sincerely|best wishes|thank you|cheers)/.test(low) ? 9 : 7) : 8
  };
  (Object.keys(scores) as (keyof typeof scores)[]).forEach((k) => (scores[k] = clamp(scores[k], 3, 11)));
  const level = clamp(Math.round(avg(Object.values(scores))), wc < 10 ? 1 : 3, 11);
  const strengths: string[] = [], weaknesses: string[] = [];
  inRange ? strengths.push("Your response fits the expected word range.") : weaknesses.push(`Your response has ${wc} words; aim for ${cfg.min}–${cfg.max}.`);
  a.connectors.length >= 4 ? strengths.push(`Good range of linking words (${a.connectors.slice(0, 4).join(", ")}).`) : weaknesses.push("Use more linking words to guide the reader between ideas.");
  a.paragraphs >= 3 ? strengths.push("Clear paragraphing makes your structure easy to follow.") : weaknesses.push("Organize your response into at least three paragraphs.");
  if (gram.length) weaknesses.push("A few mechanical errors were detected; proofread before submitting.");
  const pts = cfg.points ?? cfg.options ?? [];
  return {
    mode: "DEMO", notice, level, scores,
    summary: "Rule-based estimate from length, organization, linking words, vocabulary variety and detectable mechanical errors. It can’t judge meaning, accuracy of ideas or subtle grammar.",
    strengths, weaknesses, grammarCorrections: gram,
    vocabularySuggestions: BASIC_SWAPS.filter(([w]) => new RegExp(`\\b${w}\\b`, "i").test(text)).slice(0, 5).map(([original, suggestion]) => ({ original, suggestion, why: "A more precise, higher-level alternative. Check it fits your sentence." })),
    restructuring: a.sentences.filter((s) => s.split(/\s+/).length > 32).slice(0, 2).map((s) => ({ original: s, improved: "Split this into two sentences at a natural break and link them with a connector such as “As a result,”." })),
    recommendations: ["Plan for two minutes before writing: one idea per bullet point.", "Leave three minutes to proofread articles, verb tense and punctuation.", "Replace general words (good, bad, thing) with precise ones."],
    sampleResponse: cfg.kind === "email"
      ? `Demo mode can’t write a personalized model answer. A band 11+ email usually follows this structure:\n\nDear [name],\n\nParagraph 1: state your purpose in one or two sentences.\nParagraph 2: ${pts[0] ?? "first point"}, with specific details.\nParagraph 3: ${pts[1] ?? "second point"}, with a concrete example.\nParagraph 4: ${pts[2] ?? "third point"}, as a clear, polite request with a deadline.\n\nClosing line, then “Sincerely,” and your name.`
      : `Demo mode can’t write a personalized model answer. A band 11+ survey response usually:\n\n1. States the choice clearly in the first sentence.\n2. Develops reason one with a specific example or consequence.\n3. Develops reason two, then acknowledges the other option fairly and explains why yours is still better.\n4. Ends with a brief conclusion in new words.`
  };
}

export function demoSpeaking(cfg: SpeakingConfig, transcript: string, durationSec: number, notice: string): SpeakingEvaluation {
  const a = analyzeText(transcript); const wpm = Math.round(a.words / (Math.max(durationSec, 10) / 60));
  const target = cfg.speak >= 90 ? 170 : 115;
  const scores = {
    fluency: clamp((wpm >= 110 && wpm <= 170 ? 9 : wpm >= 85 ? 7 : 5) - Math.min(3, Math.floor(a.fillerTotal / 3)), 3, 11),
    vocabulary: clamp(4 + (a.typeTokenRatio > 0.6 ? 3 : a.typeTokenRatio > 0.5 ? 2 : 1) + (a.longWordRatio > 0.1 ? 2 : 1), 3, 11),
    grammar: 8, coherence: clamp(5 + Math.min(4, a.connectors.length), 3, 11), relevance: 8,
    development: clamp(Math.round(4 + 6 * Math.min(1, a.words / target)), 3, 11)
  };
  return {
    mode: "DEMO", notice, level: a.words < 10 ? 1 : clamp(Math.round(avg(Object.values(scores))), 3, 11), scores,
    summary: `Rule-based estimate: about ${wpm} words per minute, ${a.fillerTotal} filler word(s), ${a.connectors.length} linking expression(s).`,
    strengths: [a.words >= target * 0.8 ? "You used most of the available speaking time." : "", a.connectors.length >= 3 ? "Good use of linking expressions." : ""].filter(Boolean),
    weaknesses: [a.words < target * 0.7 ? "Your answer was short; develop each idea with an example." : "", a.fillerTotal > 4 ? "Frequent filler words interrupt your fluency." : ""].filter(Boolean),
    grammarMistakes: grammarHeuristics(transcript).filter((g) => !/capital/.test(g.explanation)),
    betterAlternatives: BASIC_SWAPS.filter(([w]) => new RegExp(`\\b${w}\\b`, "i").test(transcript)).slice(0, 4).map(([original, better]) => ({ original, better })),
    fluencyTips: ["Use preparation time to pick two main points and one example for each.", "Replace fillers with a short silent pause.", "Signal structure out loud: “My first reason is…”, “On top of that…”, “So overall…”."],
    modelResponse: "Demo mode can’t generate a personalized model answer. Strong responses open with a direct answer, develop two points with examples, use varied linking phrases and finish with a short summary before time runs out.",
    local: { words: a.words, wordsPerMinute: wpm, fillers: a.fillers, fillerTotal: a.fillerTotal, repeated: a.repeated },
    pronunciation: { assessed: false, note: "Pronunciation isn’t assessed: it needs acoustic analysis, which a transcript can’t provide." }
  };
}
