import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { analyzeText, grammarHeuristics } from "@/lib/text-analysis";
import { extractJson, generateJson, AIError, getAIConfig } from "@/lib/ai/provider";
import { writingEvalSchema } from "@/lib/ai/schemas";
import { evaluateWriting, evaluateSpeaking } from "@/lib/ai/evaluate";
import { demoWriting } from "@/lib/ai/demo";
import { attemptSchema, mockStartSchema, registerSchema } from "@/lib/validation";
import type { WritingConfig, SpeakingConfig } from "@/lib/content-types";

const cfg: WritingConfig = { task: 1, kind: "email", minutes: 27, min: 150, max: 200, prompt: "Write to your contractor.", points: ["a", "b", "c"], register: "Formal" };
const scfg: SpeakingConfig = { task: 1, prep: 30, speak: 90, prompt: "Give advice." };
const validEval = { level: 10, scores: { content: 10, coherence: 9, vocabulary: 10, grammar: 11, clarity: 10, tone: 10 }, summary: "Good.", strengths: ["x"], weaknesses: [], grammarCorrections: [], vocabularySuggestions: [], restructuring: [], recommendations: ["y"], sampleResponse: "Sample" };
const anthropicReply = (text: string, status = 200) => new Response(JSON.stringify({ content: [{ type: "text", text }] }), { status, headers: { "content-type": "application/json" } });

describe("text analysis", () => {
  it("counts fillers, connectors and repetition", () => {
    const a = analyzeText("Um, I think, um, that transit matters. However, transit costs money. Transit is, you know, essential. Therefore we should invest.");
    expect(a.fillers.find((f) => f.word === "um")?.count).toBe(2); expect(a.fillers.find((f) => f.word === "you know")).toBeTruthy();
    expect(a.connectors).toEqual(expect.arrayContaining(["however", "therefore"])); expect(a.repeated[0]).toEqual({ word: "transit", count: 3 });
  });
  it("finds common grammar slips", () => { const g = grammarHeuristics("i could of gone. it was alot of fun."); expect(g.map((x) => x.corrected)).toEqual(expect.arrayContaining(["I", "could have", "a lot"])); });
});

describe("AI provider", () => {
  const env = { ...process.env };
  beforeEach(() => { process.env.AI_PROVIDER = "anthropic"; process.env.ANTHROPIC_API_KEY = "test-key"; });
  afterEach(() => { process.env = { ...env }; });
  it("extracts JSON from fenced or wrapped replies", () => { expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 }); expect(extractJson('Sure! {"a":2} Done.')).toEqual({ a: 2 }); expect(() => extractJson("nope")).toThrow(AIError); });
  it("validates and clamps model output", async () => {
    const r = await generateJson("p", writingEvalSchema, { fetcher: async () => anthropicReply(JSON.stringify({ ...validEval, level: 14, scores: { ...validEval.scores, tone: 0 } })) });
    expect(r.level).toBe(12); expect(r.scores.tone).toBe(1);
  });
  it("retries once after a rate limit", async () => {
    let n = 0; const r = await generateJson("p", writingEvalSchema, { fetcher: async () => (++n === 1 ? new Response("{}", { status: 429 }) : anthropicReply(JSON.stringify(validEval))) });
    expect(n).toBe(2); expect(r.level).toBe(10);
  }, 10000);
  it("sends the key only server-side in headers", async () => {
    let headers: Record<string, string> = {}; await generateJson("p", writingEvalSchema, { fetcher: async (_u, init) => { headers = init!.headers as Record<string, string>; return anthropicReply(JSON.stringify(validEval)); } });
    expect(headers["x-api-key"]).toBe("test-key");
  });
  it("falls back to a labelled demo evaluation on failure", async () => {
    const ev = await evaluateWriting(cfg, "Dear Sir, this is a test response.", { fetcher: async () => new Response("bad", { status: 500 }) });
    expect(ev.mode).toBe("DEMO"); expect(ev.notice).toMatch(/demo evaluation/);
  }, 10000);
  it("uses demo mode when no provider is configured", async () => {
    delete process.env.ANTHROPIC_API_KEY; process.env.AI_PROVIDER = ""; expect(getAIConfig().provider).toBe("demo");
    const ev = await evaluateSpeaking(scfg, "I would advise you to weigh up the extra hours carefully because your health matters.", 60);
    expect(ev.mode).toBe("DEMO"); expect(ev.pronunciation.assessed).toBe(false);
  });
});

describe("demo evaluator", () => {
  it("never claims level 12 and rewards structure", () => {
    const weak = demoWriting(cfg, "hi i want fix kitchen now", ""); 
    const strong = demoWriting(cfg, "Dear Mr. Patel,\n\nI am writing regarding the renovation of my kitchen, which was scheduled to take three weeks but is now in its sixth week. However, the countertops remain unfinished.\n\nConsequently, my family has been without a functioning sink for almost a month. Moreover, I took two days off work for deliveries that never arrived, which was considerably expensive.\n\nTherefore, I would appreciate a written schedule by Friday and completion within two weeks. Otherwise, I would like to discuss an adjustment to the final invoice.\n\nSincerely,\nAmira", "");
    expect(strong.level).toBeGreaterThan(weak.level); expect(strong.level).toBeLessThan(12); expect(strong.mode).toBe("DEMO");
  });
});

describe("validation", () => {
  it("rejects malformed input", () => {
    expect(registerSchema.safeParse({ name: "A", email: "bad", password: "12345678" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "A", email: "A@B.CO", password: "short" }).success).toBe(false);
    expect(registerSchema.parse({ name: " Ana ", email: "Ana@Example.com", password: "longenough" }).email).toBe("ana@example.com");
    expect(attemptSchema.safeParse({ exerciseId: "x", answers: {}, durationSec: -1 }).success).toBe(false);
    expect(mockStartSchema.safeParse({ kind: "SECTION", skill: "MATH" }).success).toBe(false);
    expect(mockStartSchema.parse({ kind: "CUSTOM", exerciseIds: ["a"] })).toMatchObject({ untimed: false });
  });
});
