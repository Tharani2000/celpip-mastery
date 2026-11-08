"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useToast } from "@/components/toaster";
import { api } from "@/lib/client";
import type { ListeningScript, PublicQuestion } from "@/lib/content-types";
import { AudioPlayer } from "./audio-player";
import { QuestionRunner, type Answers } from "./question-runner";
import { ResultsPanel, type PracticeResult } from "./results-review";
import { useCountdown } from "./timer";

export type ListeningEx = { id: string; part: number; taskType: string; title: string; context: string | null; maxPlays: number | null; script: ListeningScript; audioUrl: string | null; questions: PublicQuestion[] };

export function ListeningExercise({ ex, rate }: { ex: ListeningEx; rate: number }) {
  const router = useRouter(); const { showXp, toast } = useToast();
  const [stage, setStage] = useState<"audio" | "questions" | "results">("audio");
  const [answers, setAnswers] = useState<Answers>({}); const [result, setResult] = useState<PracticeResult | null>(null);
  const [timeUp, setTimeUp] = useState(false); const [showScript, setShowScript] = useState(false); const [busy, setBusy] = useState(false);
  const started = useRef(Date.now());
  const submit = useCallback(async (expired = false) => {
    if (busy) return; setBusy(true);
    try { const r = await api<PracticeResult & { events: { xp: number; reason: string }[] }>("/api/attempts", { method: "POST", json: { exerciseId: ex.id, answers, durationSec: Math.round((Date.now() - started.current) / 1000) } }); setResult(r); setTimeUp(expired); setStage("results"); showXp(r.events); router.refresh(); window.scrollTo(0, 0); }
    catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  }, [answers, busy, ex.id, router, showXp, toast]);
  const left = useCountdown(stage === "questions" ? ex.questions.length * 50 : null, () => submit(true), stage === "questions");
  const onAnswer = useCallback((q: string, o: string) => setAnswers((a) => ({ ...a, [q]: o })), []);
  return (
    <div className="space-y-5">
      <div><Button variant="outline" size="sm" asChild><Link href="/listening"><ChevronLeft />All listening</Link></Button><p className="mt-3 text-sm text-muted-foreground">Part {ex.part}: {ex.taskType}</p><h1 className="text-3xl font-bold">{ex.title}</h1></div>
      {stage === "results" && result ? (
        <ResultsPanel result={result} timeUp={timeUp} backHref="/listening" onRetry={() => { setAnswers({}); setResult(null); setStage("audio"); started.current = Date.now(); }}
          extra={<Button variant="outline" size="sm" onClick={() => setShowScript(!showScript)}>{showScript ? "Hide transcript" : "Show transcript"}</Button>} />
      ) : (<>
        <Card className="space-y-4 p-5"><p className="text-muted-foreground">{ex.context}</p>
          <AudioPlayer script={ex.script} audioUrl={ex.audioUrl} maxPlays={ex.maxPlays ?? 2} rate={rate} onEnded={() => setStage((s) => (s === "audio" ? "questions" : s))} />
          {stage === "audio" && <div className="flex flex-wrap items-center gap-3"><Button variant="outline" size="sm" onClick={() => setStage("questions")}>Answer questions now</Button><p className="text-sm text-muted-foreground">Questions appear when the recording ends, as in the real test.</p></div>}
        </Card>
        {stage === "questions" && <Card className="p-5"><QuestionRunner questions={ex.questions} answers={answers} onAnswer={onAnswer} onSubmit={() => submit(false)} timeLeft={left} /></Card>}
      </>)}
      {stage === "results" && showScript && <Card className="space-y-2 p-5"><h3 className="font-bold">Transcript</h3>{ex.script.lines.map(([k, t], i) => <p key={i}><b>{ex.script.speakers[k]?.name}:</b> {t}</p>)}</Card>}
      {stage !== "results" && !ex.audioUrl && <Notice>Recordings are voiced by your browser’s speech engine with a different voice for each speaker where available. Use headphones; adjust speed in Settings.</Notice>}
    </div>
  );
}
