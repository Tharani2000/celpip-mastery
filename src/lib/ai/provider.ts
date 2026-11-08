import type { ZodType, ZodTypeDef } from "zod";

export type AIErrorCode = "not_configured" | "rate_limited" | "invalid_response" | "timeout" | "failed";
export class AIError extends Error { constructor(public code: AIErrorCode, message: string) { super(message); } }

export type AIConfig = { provider: "anthropic" | "openai"; apiKey: string; model: string } | { provider: "demo" };

/** Reads provider settings from the environment. Keys never reach the browser: this module is server-only. */
export function getAIConfig(): AIConfig {
  const p = (process.env.AI_PROVIDER || "").toLowerCase();
  if (p === "demo") return { provider: "demo" };
  if ((p === "anthropic" || !p) && process.env.ANTHROPIC_API_KEY) return { provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5" };
  if ((p === "openai" || !p) && process.env.OPENAI_API_KEY) return { provider: "openai", apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || "gpt-4o-mini" };
  return { provider: "demo" };
}
export const aiConfigured = () => getAIConfig().provider !== "demo";

const SYSTEM = "You are an expert CELPIP General rater and English coach. You always reply with a single JSON object and nothing else: no prose, no Markdown fences.";

/** Pulls one JSON value out of a model reply, tolerating code fences or a sentence around it. */
export function extractJson(text: string): unknown {
  const t = text.trim();
  try { return JSON.parse(t); } catch { /* continue */ }
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch { /* continue */ } }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* continue */ } }
  throw new AIError("invalid_response", "The model reply was not valid JSON.");
}

type Fetcher = typeof fetch;
async function callOnce(cfg: Exclude<AIConfig, { provider: "demo" }>, prompt: string, maxTokens: number, f: Fetcher): Promise<string> {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), Number(process.env.AI_TIMEOUT_MS || 60000));
  try {
    const res = cfg.provider === "anthropic"
      ? await f("https://api.anthropic.com/v1/messages", { method: "POST", signal: ctl.signal, headers: { "content-type": "application/json", "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: cfg.model, max_tokens: maxTokens, system: SYSTEM, messages: [{ role: "user", content: prompt }] }) })
      : await f("https://api.openai.com/v1/chat/completions", { method: "POST", signal: ctl.signal, headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` }, body: JSON.stringify({ model: cfg.model, max_tokens: maxTokens, response_format: { type: "json_object" }, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }] }) });
    if (res.status === 429) throw new AIError("rate_limited", "The AI provider is rate limiting requests.");
    if (!res.ok) throw new AIError("failed", `AI provider returned ${res.status}.`);
    const data = await res.json();
    const text = cfg.provider === "anthropic" ? (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("") : data.choices?.[0]?.message?.content ?? "";
    if (!text) throw new AIError("invalid_response", "The AI provider returned an empty reply.");
    return text;
  } catch (e) {
    if (e instanceof AIError) throw e;
    if ((e as Error).name === "AbortError") throw new AIError("timeout", "The AI provider took too long to respond.");
    throw new AIError("failed", "Could not reach the AI provider.");
  } finally { clearTimeout(timer); }
}

/** Calls the configured LLM and validates the JSON reply with Zod. Retries once on rate limits, server errors or malformed JSON. */
export async function generateJson<T>(prompt: string, schema: ZodType<T, ZodTypeDef, unknown>, opts: { maxTokens?: number; fetcher?: Fetcher } = {}): Promise<T> {
  const cfg = getAIConfig();
  if (cfg.provider === "demo") throw new AIError("not_configured", "No AI provider is configured.");
  const f = opts.fetcher ?? fetch;
  let last: AIError | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callOnce(cfg, prompt, opts.maxTokens ?? 3000, f);
      const parsed = schema.safeParse(extractJson(raw));
      if (!parsed.success) throw new AIError("invalid_response", "The AI reply didn’t match the expected format.");
      return parsed.data;
    } catch (e) {
      last = e as AIError;
      if (!(last.code === "rate_limited" || last.code === "invalid_response" || last.code === "failed") || attempt === 1) break;
      await new Promise((r) => setTimeout(r, last!.code === "rate_limited" ? 2000 : 500));
    }
  }
  throw last ?? new AIError("failed", "AI request failed.");
}

export function aiNotice(e: unknown): string {
  const code = e instanceof AIError ? e.code : "failed";
  return {
    not_configured: "No AI provider is configured, so this is a rule-based demo evaluation.",
    rate_limited: "The AI service is busy (rate limited), so this is a demo evaluation. Try again in a minute for full feedback.",
    invalid_response: "The AI reply couldn’t be read, so this is a demo evaluation. Submitting again usually works.",
    timeout: "The AI service took too long, so this is a demo evaluation.",
    failed: "The AI service failed, so this is a demo evaluation."
  }[code];
}
