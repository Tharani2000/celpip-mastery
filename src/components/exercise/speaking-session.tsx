"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Download, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Textarea } from "@/components/ui/input";
import { cn, mmss, wordCount } from "@/lib/utils";
import type { SpeakingConfig } from "@/lib/content-types";
import { useCountdown } from "./timer";
import { useRecorder } from "./use-recorder";
import { sceneSvg, sceneAlt } from "./scenes";

export type SpeakingCapture = { blob: Blob | null; durationSec: number; transcript: string; choice: number | null };

export function SpeakingPrompt({ cfg, choice, onChoice, locked }: { cfg: SpeakingConfig; choice: number | null; onChoice?: (i: number) => void; locked?: boolean }) {
  return (
    <Card className="space-y-4 p-5">
      <p className="passage font-bold">{cfg.prompt}</p>
      {cfg.image && <div role="img" aria-label={sceneAlt(cfg.image)} className="overflow-hidden rounded-2xl border bg-white" dangerouslySetInnerHTML={{ __html: sceneSvg(cfg.image) }} />}
      {cfg.choices && <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">{cfg.choices.map((c, i) => (
        <button key={c.name} role="radio" aria-checked={choice === i} disabled={locked} onClick={() => onChoice?.(i)} className={cn("flex flex-col items-start gap-1 rounded-2xl border-[1.5px] p-4 text-left", choice === i && "border-purple bg-accent")}>
          <b className="font-display">{c.name}{choice === i ? " (your choice)" : ""}</b>{c.details.map((d) => <span key={d} className="text-sm text-muted-foreground">{d}</span>)}</button>))}</div>}
    </Card>
  );
}

/** Preparation countdown → automatic recording → speaking countdown. Exam mode removes early stop and skip. */
export function SpeakingStage({ cfg, exam, autoStart, onCaptured, micReady }: { cfg: SpeakingConfig; exam?: boolean; autoStart?: boolean; onCaptured: (c: SpeakingCapture) => void; micReady?: boolean }) {
  const rec = useRecorder();
  const [phase, setPhase] = useState<"ready" | "prep" | "rec" | "saving">(autoStart ? "prep" : "ready");
  const [choice, setChoice] = useState<number | null>(cfg.choices ? (exam ? 0 : null) : null);
  const [micError, setMicError] = useState(""); const [mic, setMic] = useState(!!micReady);
  const done = useRef(false);
  const begin = useCallback(async () => {
    if (cfg.choices && choice === null) { setMicError("Choose the option you’ll argue for first."); return; }
    try { await rec.ensureMic(); setMic(true); setMicError(""); } catch (e) { setMic(false); setMicError((e as Error).name === "NotAllowedError" ? "Microphone access was blocked, so nothing will be recorded. Allow the microphone in your browser’s site settings, or carry on and type what you said afterwards." : "No microphone is available, so nothing will be recorded. You can still practise with the timers and type what you said afterwards."); }
    setPhase("prep");
  }, [cfg.choices, choice, rec]);
  const { ensureMic } = rec;
  useEffect(() => { if (autoStart) ensureMic().then(() => setMic(true)).catch(() => setMic(false)); }, [autoStart, ensureMic]);
  const startRec = useCallback(() => { setPhase("rec"); rec.start(); }, [rec]);
  const finish = useCallback(async () => { if (done.current) return; done.current = true; setPhase("saving"); const r = await rec.stop(); onCaptured({ ...r, durationSec: Math.min(cfg.speak, r.durationSec), choice }); }, [rec, onCaptured, cfg.speak, choice]);
  const prepLeft = useCountdown(phase === "prep" ? cfg.prep : null, startRec, phase === "prep");
  const speakLeft = useCountdown(phase === "rec" ? cfg.speak : null, finish, phase === "rec");
  return (
    <div className="space-y-4">
      {micError && <Notice tone="warning">{micError}</Notice>}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <SpeakingPrompt cfg={cfg} choice={choice} onChoice={setChoice} locked={phase !== "ready"} />
        <Card className="flex flex-col items-center gap-4 p-7 text-center">
          {phase === "ready" && <><p className="font-bold text-muted-foreground">Ready when you are</p><p className="max-w-[46ch] text-muted-foreground">Preparation starts first; recording begins automatically when it ends.</p><Button size="lg" onClick={begin} data-testid="start-prep"><Mic />Start preparation</Button><p className="text-xs text-muted-foreground">Your browser will ask for microphone access the first time.</p></>}
          {phase === "prep" && <><p className="font-bold text-muted-foreground">Preparation time</p><p className="font-display text-5xl font-extrabold tabular-nums" role="timer">{mmss(Math.ceil(prepLeft))}</p><p className="text-muted-foreground">Plan two main points and an example for each.</p>{!exam && <Button variant="outline" onClick={startRec} data-testid="skip-prep">Start speaking now</Button>}</>}
          {phase === "rec" && <><p className="font-bold text-destructive">{mic ? "Recording" : "Speaking time (not recording)"}</p><p className="font-display text-5xl font-extrabold tabular-nums" role="timer">{mmss(Math.ceil(speakLeft))}</p>
            <button onClick={exam ? undefined : finish} disabled={exam} aria-label={exam ? "Recording" : "Stop recording"} data-testid="stop-rec" className={cn("grid size-24 place-items-center rounded-full text-white", mic ? "animate-pulse-ring bg-destructive" : "brand-gradient")}>{exam ? <Mic className="size-10" /> : <Square className="size-9 fill-current" />}</button>
            {mic && <div className="flex h-7 items-end gap-[3px]" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} className="w-[5px] rounded-sm bg-cyan transition-[height]" style={{ height: Math.max(4, Math.min(28, rec.level * 60 * (0.5 + Math.abs(Math.sin(i + Date.now() / 120))))) }} />)}</div>}
            {rec.recogSupported && <p className="min-h-[3em] max-w-[60ch] text-sm text-muted-foreground" aria-live="polite">{rec.live || "Listening…"}</p>}</>}
          {phase === "saving" && <p className="font-bold text-muted-foreground">Finishing your recording…</p>}
        </Card>
      </div>
    </div>
  );
}

export function ReviewCapture({ capture, onTranscript, transcript, onSubmit, onRetry, busy, speak }: { capture: SpeakingCapture; transcript: string; onTranscript: (t: string) => void; onSubmit: () => void; onRetry: () => void; busy: boolean; speak: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { if (!capture.blob) return; const u = URL.createObjectURL(capture.blob); setUrl(u); return () => URL.revokeObjectURL(u); }, [capture.blob]);
  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-bold">Review your response</h3><span className="text-sm text-muted-foreground">{mmss(capture.durationSec)} of {mmss(speak)} spoken</span></div>
      {url ? <audio controls src={url} className="w-full" /> : <p className="text-sm text-muted-foreground">No audio was recorded.</p>}
      <label className="block space-y-1.5"><span className="text-sm font-bold">Transcript</span><span className="block text-xs text-muted-foreground">{capture.transcript ? "Auto-generated by your browser. Fix recognition errors only, not your real mistakes, so the feedback stays honest. If server transcription is configured, it replaces this automatically." : "Type what you said as accurately as you can, including hesitations."}</span>
        <Textarea rows={7} value={transcript} onChange={(e) => onTranscript(e.target.value)} data-testid="transcript" /></label>
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm text-muted-foreground">{wordCount(transcript)} words</span>
        <div className="flex flex-wrap gap-2">{url && <Button variant="outline" asChild><a href={url} download={`celpip-speaking-${new Date().toISOString().slice(0, 10)}.webm`}><Download />Save recording</a></Button>}<Button variant="outline" onClick={onRetry}><RotateCcw />Record again</Button><Button onClick={onSubmit} disabled={busy} data-testid="submit-speaking">{busy ? "Evaluating…" : "Submit for feedback"}</Button></div></div>
    </Card>
  );
}
