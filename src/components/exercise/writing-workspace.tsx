"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/toaster";
import { api } from "@/lib/client";
import { cn, wordCount } from "@/lib/utils";
import type { WritingConfig } from "@/lib/content-types";
import type { WritingEvaluation } from "@/lib/ai/schemas";
import { useCountdown, TimerChip } from "./timer";
import { WritingFeedback } from "./writing-feedback";

export function PromptCard({ cfg, tips }: { cfg: WritingConfig; tips?: boolean }) {
  return (
    <Card className="space-y-4 p-5 lg:sticky lg:top-4">
      <p className="passage">{cfg.prompt}</p>
      {cfg.points ? <div><p className="text-sm font-bold">In your email, do the following:</p><ul className="mt-2 list-disc space-y-1 pl-5">{cfg.points.map((p) => <li key={p}>{p}</li>)}</ul></div>
        : <div className="space-y-2">{cfg.options?.map((o) => <div key={o} className="rounded-xl border bg-secondary/50 p-3">{o}</div>)}</div>}
      {cfg.register && <p className="text-sm text-muted-foreground">Expected register: {cfg.register}</p>}
      {tips && <details className="rounded-xl border"><summary className="cursor-pointer p-3 text-sm font-bold">Tips for band 10+</summary><ul className="list-disc space-y-1 px-8 pb-3 text-sm text-muted-foreground">{cfg.task === 1 ? <><li>Open with your purpose in the first sentence.</li><li>One paragraph per bullet point, with concrete details.</li><li>Match the register to the reader.</li><li>End with a clear request and a courteous sign-off.</li></> : <><li>State your choice in the first sentence.</li><li>Develop two reasons with specific examples.</li><li>Acknowledge the other option, then explain why yours is better.</li><li>Stay within the word range.</li></>}</ul></details>}
    </Card>
  );
}
export function WordCount({ text, min, max }: { text: string; min: number; max: number }) {
  const n = wordCount(text); return <span><b className={cn("font-display tabular-nums", n && (n >= min && n <= max ? "text-success" : "text-warning"))}>{n}</b> <span className="text-sm text-muted-foreground">words ({min}–{max})</span></span>;
}

type Submitted = { evaluation: WritingEvaluation; words: number; xp: number; messages: string[]; events: { xp: number; reason: string }[] };
export function WritingWorkspace({ exerciseId, title, cfg, initialDraft }: { exerciseId: string; title: string; cfg: WritingConfig; initialDraft: string }) {
  const router = useRouter(); const { toast, showXp } = useToast();
  const [text, setText] = useState(initialDraft); const [stage, setStage] = useState<"work" | "evaluating" | "done">("work");
  const [result, setResult] = useState<Submitted | null>(null); const [confirm, setConfirm] = useState(false); const [timeUp, setTimeUp] = useState(false); const [saved, setSaved] = useState(initialDraft ? "Draft restored" : "");
  const started = useRef(Date.now()); const textRef = useRef(text); textRef.current = text;
  const save = useCallback(async (quiet = true) => { try { await api("/api/writing/draft", { method: "PUT", silent: quiet, json: { exerciseId, text: textRef.current } }); setSaved("Draft saved"); if (!quiet) toast("Draft saved."); } catch (e) { if (!quiet) toast((e as Error).message, "error"); } }, [exerciseId, toast]);
  useEffect(() => { if (stage !== "work") return; const t = setTimeout(() => { if (textRef.current.trim()) void save(true); }, 1500); return () => clearTimeout(t); }, [text, stage, save]);
  const submit = useCallback(async (expired = false) => {
    if (wordCount(textRef.current) < 10) { if (expired) { setTimeUp(true); toast("Time is up. Your draft has been saved; write at least 10 words to get feedback.", "error"); void save(true); } else toast("Write at least 10 words before submitting.", "error"); return; }
    setStage("evaluating"); setTimeUp(expired); window.scrollTo(0, 0);
    try { const r = await api<Submitted>("/api/writing", { method: "POST", json: { exerciseId, text: textRef.current, durationSec: Math.round((Date.now() - started.current) / 1000) } }); setResult(r); setStage("done"); showXp(r.events); router.refresh(); }
    catch (e) { toast((e as Error).message, "error"); setStage("work"); }
  }, [exerciseId, router, save, showXp, toast]);
  const left = useCountdown(stage === "work" && !timeUp ? cfg.minutes * 60 : null, () => submit(true), stage === "work" && !timeUp);
  const head = <div className="flex flex-wrap items-end justify-between gap-3"><div><Button variant="outline" size="sm" asChild><Link href="/writing"><ChevronLeft />All writing</Link></Button><p className="mt-3 text-sm text-muted-foreground">Task {cfg.task}: {cfg.task === 1 ? "Writing an Email" : "Responding to Survey Questions"}</p><h1 className="text-3xl font-bold">{title}</h1></div>{stage === "work" && !timeUp && <TimerChip left={left} />}</div>;
  if (stage === "evaluating") return <div className="space-y-4">{head}<p className="text-muted-foreground">Evaluating your response. AI feedback can take up to a minute.</p><Skeleton className="h-28" /><Skeleton className="h-48" /><Skeleton className="h-64" /></div>;
  if (stage === "done" && result) return <div className="space-y-4">{head}{timeUp && <Notice tone="warning">Time ran out, so your response was submitted automatically.</Notice>}<WritingFeedback evaluation={result.evaluation} text={text} words={result.words} exerciseId={exerciseId} xp={result.xp} messages={result.messages} /></div>;
  return (
    <div className="space-y-5">{head}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <PromptCard cfg={cfg} tips />
        <Card className="space-y-3 p-5">
          <label htmlFor="editor" className="sr-only">Your response</label>
          <textarea id="editor" data-testid="editor" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} placeholder={cfg.task === 1 ? "Dear …" : "I prefer Option …"} className="min-h-[360px] w-full resize-y rounded-2xl border border-input bg-card p-4 text-[1.05rem] leading-relaxed focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25" />
          <div className="flex flex-wrap items-center justify-between gap-2"><WordCount text={text} min={cfg.min} max={cfg.max} /><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{saved}</span><Button variant="outline" onClick={() => save(false)}><Save />Save draft</Button><Button onClick={() => setConfirm(true)} data-testid="submit-writing">Submit for feedback</Button></div></div>
          <p className="text-xs text-muted-foreground">Spell-check is off, as in the real test. Drafts save automatically.</p>
        </Card>
      </div>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Submit for feedback?" confirmLabel="Submit" description={(() => { const n = wordCount(text); return n < cfg.min || n > cfg.max ? `Your response has ${n} words; the expected range is ${cfg.min}–${cfg.max}.` : `Your response has ${n} words.`; })()} onConfirm={() => submit(false)} />
    </div>
  );
}
