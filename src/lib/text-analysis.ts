import { wordCount } from "./utils";

const STOP = new Set("the a an and or but so to of in on at for with is are was were be been it this that i you we they he she my our your their me us them as by from if then than not no yes do did does have has had will would can could should just very really also there here what which who when where how about into out up down more most some any all one two get got make made go going think like".split(" "));
export const FILLERS = ["um", "uh", "er", "erm", "ah", "you know", "i mean", "basically", "actually", "sort of", "kind of", "like"];
export const CONNECTORS = ["however", "therefore", "moreover", "furthermore", "in addition", "consequently", "although", "whereas", "while", "for instance", "for example", "as a result", "on the other hand", "nevertheless", "first", "second", "finally", "in conclusion", "overall", "because", "since", "despite", "that said", "in my view", "to begin with", "not only"];

export type TextStats = { words: number; sentences: string[]; avgSentenceLength: number; typeTokenRatio: number; longWordRatio: number; repeated: { word: string; count: number }[]; fillers: { word: string; count: number }[]; fillerTotal: number; connectors: string[]; paragraphs: number };

export function analyzeText(text: string): TextStats {
  const t = String(text || "");
  const low = " " + t.toLowerCase().replace(/[’]/g, "'") + " ";
  const words = low.match(/[a-z0-9'-]+/g) || [];
  const sentences = t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => wordCount(s) > 0);
  const freq: Record<string, number> = {};
  for (const w of words) if (!STOP.has(w) && w.length > 3) freq[w] = (freq[w] || 0) + 1;
  const repeated = Object.entries(freq).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([word, count]) => ({ word, count }));
  const fillers: { word: string; count: number }[] = [];
  for (const f of FILLERS) { const re = new RegExp(`[\\s,.]${f.replace(" ", "\\s")}(?=[\\s,.])`, "g"); const n = (low.match(re) || []).length; if (n && !(f === "like" && n < 3)) fillers.push({ word: f, count: n }); }
  const connectors = CONNECTORS.filter((c) => low.includes(` ${c} `) || low.includes(` ${c},`));
  const unique = new Set(words).size;
  return { words: words.length, sentences, avgSentenceLength: sentences.length ? words.length / sentences.length : 0, typeTokenRatio: words.length ? unique / words.length : 0, longWordRatio: words.length ? words.filter((w) => w.length >= 8).length / words.length : 0, repeated, fillers, fillerTotal: fillers.reduce((n, f) => n + f.count, 0), connectors, paragraphs: t.split(/\n\s*\n/).filter((p) => p.trim()).length };
}

export type Fix = { original: string; corrected: string; explanation: string };
export function grammarHeuristics(text: string): Fix[] {
  const out: Fix[] = [];
  const checks: [RegExp, (m: string) => Fix][] = [
    [/(?<=\s|^)i(?=\s)/g, (m) => ({ original: m, corrected: "I", explanation: "The pronoun “I” is always capitalized." })],
    [/\b(could|should|would) of\b/gi, (m) => ({ original: m, corrected: m.replace(/ of$/i, " have"), explanation: "Use “have” after modal verbs, not “of.”" })],
    [/\balot\b/gi, (m) => ({ original: m, corrected: "a lot", explanation: "“A lot” is two words; in formal writing prefer “a great deal” or “many.”" })],
    [/\b(\w+) \1\b/gi, (m) => ({ original: m, corrected: m.split(" ")[0], explanation: "Repeated word." })],
    [/\b(informations|advices|furnitures|equipments)\b/gi, (m) => ({ original: m, corrected: m.slice(0, -1), explanation: "This noun is uncountable and has no plural form." })],
    [/\bdiscuss about\b/gi, (m) => ({ original: m, corrected: "discuss", explanation: "“Discuss” takes a direct object; no “about.”" })],
    [/[.!?]\s+[a-z]/g, (m) => ({ original: m.trim(), corrected: m.trim().slice(0, -1) + m.trim().slice(-1).toUpperCase(), explanation: "Start each sentence with a capital letter." })]
  ];
  for (const [re, fn] of checks) { const ms = text.match(re); if (ms) ms.slice(0, 2).forEach((m) => out.push(fn(m))); if (out.length >= 6) break; }
  return out.slice(0, 6);
}
export const BASIC_SWAPS: [string, string][] = [["very important", "crucial"], ["a lot of", "a considerable number of"], ["very bad", "detrimental"], ["very good", "highly beneficial"], ["big", "substantial"], ["good", "valuable"], ["bad", "problematic"], ["thing", "aspect"], ["things", "factors"], ["get", "obtain"], ["show", "demonstrate"], ["help", "assist"], ["think", "believe"], ["fix", "resolve"], ["many", "numerous"]];
