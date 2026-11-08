"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/toaster";
import { wordCount } from "@/lib/utils";
import type { SpeakingConfig } from "@/lib/content-types";
import type { SpeakingEvaluation } from "@/lib/ai/schemas";
import { SpeakingStage, ReviewCapture, type SpeakingCapture } from "./speaking-session";
import { SpeakingFeedback } from "./speaking-feedback";

type Result = { submissionId: string; transcript: string; evaluation: SpeakingEvaluation; xp: number; messages: string[]; events: { xp: number; reason: string }[]; hasAudio: boolean };
export function SpeakingPractice({ exerciseId, taskType, cfg }: { exerciseId: string; taskType: string; cfg: SpeakingConfig }) {
  const router = useRouter(); const { toast, showXp } = useToast();
  const [run, setRun] = useState(0); const [capture, setCapture] = useState<SpeakingCapture | null>(null); const [transcript, setTranscript] = useState(""); const [busy, setBusy] = useState(false); const [result, setResult] = useState<Result | null>(null);
  const submit = async () => {
    if (!capture) return; if (wordCount(transcript) < 15 && !capture.blob) { toast("Add at least 15 words to the transcript before submitting.", "error"); return; }
    setBusy(true);
    const f = new FormData(); f.set("exerciseId", exerciseId); f.set("transcript", transcript); f.set("transcriptSource", transcript === capture.transcript ? "browser" : "typed"); f.set("durationSec", String(Math.round(capture.durationSec)));
    if (capture.blob) f.set("audio", capture.blob, "response.webm");
    try { const r = await fetch("/api/speaking", { method: "POST", body: f }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setResult(d); showXp(d.events); router.refresh(); window.scrollTo(0, 0); }
    catch (e) { toast((e as Error).message || "Submission failed.", "error"); } finally { setBusy(false); }
  };
  const retry = () => { setCapture(null); setTranscript(""); setResult(null); setRun((n) => n + 1); };
  return (
    <div className="space-y-5">
      <div><Button variant="outline" size="sm" asChild><Link href="/speaking"><ChevronLeft />All speaking</Link></Button><p className="mt-3 text-sm text-muted-foreground">Task {cfg.task}, {cfg.prep}s preparation, {cfg.speak}s speaking</p><h1 className="text-3xl font-bold">{taskType}</h1></div>
      {result ? <SpeakingFeedback evaluation={result.evaluation} transcript={result.transcript} durationSec={capture?.durationSec ?? 0} exerciseId={exerciseId} audioUrl={result.hasAudio ? `/api/audio/${result.submissionId}` : null} xp={result.xp} messages={result.messages} />
        : busy ? <div className="space-y-4"><p className="text-muted-foreground">Transcribing and evaluating your response…</p><Skeleton className="h-28" /><Skeleton className="h-56" /></div>
        : capture ? <ReviewCapture capture={capture} transcript={transcript} onTranscript={setTranscript} onSubmit={submit} onRetry={retry} busy={busy} speak={cfg.speak} />
        : <SpeakingStage key={run} cfg={cfg} onCaptured={(c) => { setCapture(c); setTranscript(c.transcript); }} />}
    </div>
  );
}
