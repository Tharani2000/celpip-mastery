"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toaster";
import { api } from "@/lib/client";
import type { PublicQuestion, ReadingPassage } from "@/lib/content-types";
import { Passage } from "./passage";
import { QuestionRunner, type Answers } from "./question-runner";
import { ResultsPanel, type PracticeResult } from "./results-review";
import { useCountdown } from "./timer";

export type ReadingEx = { id: string; part: number; taskType: string; title: string; timeLimitSec: number | null; passage: ReadingPassage; questions: PublicQuestion[] };

export function ReadingExercise({ ex }: { ex: ReadingEx }) {
  const router = useRouter(); const { showXp, toast } = useToast();
  const [answers, setAnswers] = useState<Answers>({}); const [result, setResult] = useState<PracticeResult | null>(null); const [timeUp, setTimeUp] = useState(false); const [busy, setBusy] = useState(false); const [run, setRun] = useState(0);
  const started = useRef(Date.now());
  const submit = useCallback(async (expired = false) => {
    if (busy) return; setBusy(true);
    try { const r = await api<PracticeResult & { events: { xp: number; reason: string }[] }>("/api/attempts", { method: "POST", json: { exerciseId: ex.id, answers, durationSec: Math.round((Date.now() - started.current) / 1000) } }); setResult(r); setTimeUp(expired); showXp(r.events); router.refresh(); window.scrollTo(0, 0); }
    catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  }, [answers, busy, ex.id, router, showXp, toast]);
  const left = useCountdown(result ? null : ex.timeLimitSec ?? 600, () => submit(true), !result);
  const onAnswer = useCallback((q: string, o: string) => setAnswers((a) => ({ ...a, [q]: o })), []);
  return (
    <div className="space-y-5" key={run}>
      <div><Button variant="outline" size="sm" asChild><Link href="/reading"><ChevronLeft />All reading</Link></Button><p className="mt-3 text-sm text-muted-foreground">Part {ex.part}: {ex.taskType}</p><h1 className="text-3xl font-bold">{ex.title}</h1></div>
      {result ? (<>
        <ResultsPanel result={result} timeUp={timeUp} backHref="/reading" onRetry={() => { setAnswers({}); setResult(null); started.current = Date.now(); setRun((n) => n + 1); }} />
        <details className="rounded-2xl border bg-card"><summary className="cursor-pointer p-4 font-bold">Show the passage again</summary><div className="px-4 pb-4"><Passage passage={ex.passage} highlight={false} /></div></details>
      </>) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Card className="p-5"><Passage passage={ex.passage} /></Card>
          <Card className="p-5 lg:sticky lg:top-4"><QuestionRunner questions={ex.questions} answers={answers} onAnswer={onAnswer} onSubmit={() => submit(false)} timeLeft={left} instructions={ex.passage.instructions} /></Card>
        </div>)}
    </div>
  );
}
