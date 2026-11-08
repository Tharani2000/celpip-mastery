"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/toaster";
import { SkillIcon } from "@/components/common";
import { api } from "@/lib/client";
import { cn, mmss, wordCount } from "@/lib/utils";
import type { ListeningScript, PublicQuestion, ReadingPassage, SpeakingConfig, WritingConfig } from "@/lib/content-types";
import type { MockItemResult } from "@/lib/validation";
import { AudioPlayer } from "@/components/exercise/audio-player";
import { QuestionRunner, type Answers } from "@/components/exercise/question-runner";
import { Passage } from "@/components/exercise/passage";
import { useCountdown, TimerChip } from "@/components/exercise/timer";
import { PromptCard, WordCount } from "@/components/exercise/writing-workspace";
import { SpeakingStage, type SpeakingCapture } from "@/components/exercise/speaking-session";

type Item = { id: string; skill: "LISTENING" | "READING" | "WRITING" | "SPEAKING"; part: number; title: string; taskType: string; context: string | null; timeLimitSec: number | null; script: unknown; passage: unknown; config: unknown; audioUrl: string | null; questions: PublicQuestion[] };
type Section = { skill: Item["skill"]; items: Item[] };
type Bar = (timer?: React.ReactNode) => React.ReactNode;
const NAME = { LISTENING: "Listening", READING: "Reading", WRITING: "Writing", SPEAKING: "Speaking" } as const;
const key = (s: Item["skill"]) => s.toLowerCase() as "listening";

function ExamBar({ title, sub, steps, current, timer, onExit }: { title: string; sub: string; steps: number; current: number; timer?: React.ReactNode; onExit: () => void }) {
  return (
    <div className="sticky top-[env(safe-area-inset-top)] z-40 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#16245A] px-4 py-3 text-white dark:border dark:bg-[#0B1435]">
      <div><b className="font-display">{title}</b><p className="text-xs opacity-80">{sub}</p></div>
      <div className="flex items-center gap-3">
        <div className="hidden gap-1.5 sm:flex" aria-hidden="true">{Array.from({ length: steps }, (_, i) => <i key={i} className={cn("h-1.5 w-7 rounded-full bg-white/25", i < current && "bg-cyan", i === current && "bg-white")} />)}</div>
        {timer}
        <Button size="sm" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={onExit}>Exit test</Button>
      </div>
    </div>
  );
}

function ObjectiveItem({ item, untimed, onDone, bar }: { item: Item; untimed: boolean; onDone: (r: MockItemResult) => void; bar: Bar }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [stage, setStage] = useState(item.skill === "LISTENING" ? "audio" : "questions");
  const started = useRef(Date.now()); const sent = useRef(false); const ans = useRef(answers); ans.current = answers;
  const finish = useCallback(() => { if (sent.current) return; sent.current = true; onDone({ type: "objective", exerciseId: item.id, answers: ans.current, durationSec: Math.round((Date.now() - started.current) / 1000) }); }, [item.id, onDone]);
  const secs = untimed ? null : item.skill === "LISTENING" ? item.questions.length * 40 : Math.round((item.timeLimitSec ?? 600) * 0.7);
  const left = useCountdown(stage === "questions" ? secs : null, finish, stage === "questions");
  const onAnswer = useCallback((q: string, o: string) => setAnswers((a) => ({ ...a, [q]: o })), []);
  const timer = stage === "questions" && secs !== null ? <TimerChip left={left} className="bg-white/15 text-white" /> : undefined;
  const runner = <QuestionRunner exam questions={item.questions} answers={answers} onAnswer={onAnswer} onSubmit={finish} instructions={(item.passage as ReadingPassage | null)?.instructions} />;
  return (
    <>
      {bar(timer)}
      {item.skill === "LISTENING" ? (
        <div className="space-y-4">
          <Card className="space-y-4 p-5"><p className="text-muted-foreground">{item.context}</p><AudioPlayer exam autoStart script={item.script as ListeningScript} audioUrl={item.audioUrl} maxPlays={1} onEnded={() => setStage("questions")} /></Card>
          {stage === "questions" && <Card className="p-5">{runner}</Card>}
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Card className="p-5"><Passage passage={item.passage as ReadingPassage} /></Card>
          <Card className="p-5 lg:sticky lg:top-24">{runner}</Card>
        </div>
      )}
    </>
  );
}

function WritingItem({ item, untimed, onDone, bar }: { item: Item; untimed: boolean; onDone: (r: MockItemResult) => void; bar: Bar }) {
  const cfg = item.config as WritingConfig;
  const [text, setText] = useState(""); const [confirm, setConfirm] = useState(false);
  const t = useRef(text); t.current = text; const started = useRef(Date.now()); const sent = useRef(false);
  const finish = useCallback(() => { if (sent.current) return; sent.current = true; onDone({ type: "writing", exerciseId: item.id, text: t.current, durationSec: Math.round((Date.now() - started.current) / 1000) }); }, [item.id, onDone]);
  const left = useCountdown(untimed ? null : cfg.minutes * 60, finish);
  return (
    <>
      {bar(untimed ? undefined : <TimerChip left={left} className="bg-white/15 text-white" />)}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <PromptCard cfg={cfg} />
        <Card className="space-y-3 p-5">
          <textarea aria-label="Your response" data-testid="editor" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} className="min-h-[360px] w-full rounded-2xl border border-input bg-card p-4 text-[1.05rem] leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25" />
          <div className="flex items-center justify-between"><WordCount text={text} min={cfg.min} max={cfg.max} /><Button onClick={() => setConfirm(true)} data-testid="submit-task">Submit task</Button></div>
        </Card>
      </div>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Submit this task?" confirmLabel="Submit" description={`Your response has ${wordCount(text)} words. You won’t be able to return to it.`} onConfirm={finish} />
    </>
  );
}

function SpeakingItem({ item, onDone, bar }: { item: Item; onDone: (r: MockItemResult) => void; bar: Bar }) {
  const cfg = item.config as SpeakingConfig; const [uploading, setUploading] = useState(false);
  const captured = async (c: SpeakingCapture) => {
    setUploading(true); let submissionId: string | undefined; let transcript = c.transcript;
    try {
      const f = new FormData(); f.set("exerciseId", item.id); f.set("transcript", c.transcript); f.set("transcriptSource", "browser"); f.set("durationSec", String(Math.round(c.durationSec))); f.set("mock", "1");
      if (c.blob) f.set("audio", c.blob, "response.webm");
      const r = await fetch("/api/speaking", { method: "POST", body: f });
      if (r.ok) { const d = await r.json(); submissionId = d.submissionId; transcript = d.transcript; }
    } catch { /* keep the browser transcript */ }
    onDone({ type: "speaking", exerciseId: item.id, transcript, durationSec: c.durationSec, submissionId });
  };
  return <>{bar()}{uploading ? <Card className="p-8 text-center text-muted-foreground">Saving your response…</Card> : <SpeakingStage exam autoStart cfg={cfg} onCaptured={captured} />}</>;
}

/** Runs a mock attempt section by section. Correct answers never reach the browser; scoring happens on submit. */
export function MockRunner({ attemptId, label, untimed }: { attemptId: string; label: string; untimed: boolean }) {
  const router = useRouter(); const { toast, showXp } = useToast();
  const [sections, setSections] = useState<Section[] | null>(null); const [si, setSi] = useState(0); const [ii, setIi] = useState(0);
  const [phase, setPhase] = useState<"intro" | "item" | "between" | "transcripts" | "submitting">("intro");
  const [results, setResults] = useState<MockItemResult[]>([]); const [exit, setExit] = useState(false); const [micOk, setMicOk] = useState<boolean | null>(null);

  useEffect(() => { api<{ sections: Section[] }>(`/api/mock/${attemptId}`).then((d) => (d.sections.length ? setSections(d.sections) : router.replace(`/mock/${attemptId}/results`))).catch((e) => toast((e as Error).message, "error")); }, [attemptId, router, toast]);
  useEffect(() => { const h = (e: BeforeUnloadEvent) => { if (phase !== "intro") e.preventDefault(); }; window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h); }, [phase]);

  const submitAll = useCallback(async (all: MockItemResult[]) => {
    setPhase("submitting");
    try { const r = await api<{ events: { xp: number; reason: string }[] }>(`/api/mock/${attemptId}/submit`, { method: "POST", json: { items: all } }); showXp(r.events); router.replace(`/mock/${attemptId}/results`); router.refresh(); }
    catch (e) { toast((e as Error).message, "error"); setPhase("transcripts"); }
  }, [attemptId, router, showXp, toast]);

  const onDone = useCallback((r: MockItemResult) => {
    const all = [...results, r]; setResults(all);
    const sec = sections![si];
    if (ii + 1 < sec.items.length) setTimeout(() => setIi(ii + 1), 300);
    else if (si + 1 < sections!.length) { setSi(si + 1); setIi(0); setPhase("between"); }
    else if (all.some((x) => x.type === "speaking")) setPhase("transcripts");
    else void submitAll(all);
    window.scrollTo(0, 0);
  }, [results, sections, si, ii, submitAll]);

  const sec = sections?.[si]; const item = sec?.items[ii]; const steps = sections?.length ?? 1;
  const betweenLeft = useCountdown(phase === "between" && sec?.skill !== "SPEAKING" ? 30 : null, () => setPhase("item"), phase === "between");
  const bar = useMemo<Bar>(() => function renderBar(timer) { return (
    <ExamBar title={item ? `${NAME[item.skill]} ${item.skill === "WRITING" || item.skill === "SPEAKING" ? `Task ${(item.config as { task: number }).task}` : `Part ${item.part}`}` : label}
      sub={`${label}: section ${si + 1} of ${steps}, item ${ii + 1} of ${sec?.items.length ?? 1}`} steps={steps} current={si} timer={timer} onExit={() => setExit(true)} />
  ); }, [item, label, si, steps, ii, sec]);
  const leave = async () => { await fetch(`/api/mock/${attemptId}`, { method: "DELETE" }).catch(() => {}); router.replace("/mock"); };
  const checkMic = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()); setMicOk(true); } catch { setMicOk(false); } };

  let body: React.ReactNode = null;
  if (!sections) body = <div className="space-y-4"><Skeleton className="h-14" /><Skeleton className="h-72" /></div>;
  else if (phase === "intro") body = (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <Card className="space-y-3 p-5"><h1 className="text-3xl font-bold">{label}</h1><p className="text-muted-foreground">Read the rules, then begin when you’re ready.</p>
        {sections.map((s, i) => <div key={i} className="flex items-center gap-3 rounded-xl border bg-secondary/50 p-3"><SkillIcon skill={key(s.skill)} /><span><b>{NAME[s.skill]}</b><br /><span className="text-sm text-muted-foreground">{s.items.length} {s.skill === "LISTENING" || s.skill === "READING" ? "part" : "task"}{s.items.length === 1 ? "" : "s"}</span></span></div>)}</Card>
      <Card className="space-y-3 p-5"><h2 className="text-xl font-bold">Rules</h2>
        <ul className="space-y-2">{["Each listening recording plays once, with no pausing.", untimed ? "Timers are off for listening, reading and writing in this custom test." : "Each part has its own timer; answers submit automatically when time runs out.", "You can move between questions within a part, but not back to a finished part.", "Speaking tasks run automatically: preparation, then recording.", "Explanations, hints and scores appear only on the results page."].map((t) => <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />{t}</li>)}</ul>
        {sections.some((s) => s.skill === "SPEAKING") && <Notice>The speaking section needs your microphone; you’ll be asked before it starts.</Notice>}
        <div className="flex gap-2"><Button size="lg" onClick={() => setPhase(sections[0].skill === "SPEAKING" ? "between" : "item")} data-testid="begin-test">Begin test</Button><Button variant="outline" onClick={() => router.push("/mock")}>Cancel</Button></div></Card>
    </div>);
  else if (phase === "between" && sec) body = (
    <>{bar()}
      <Card className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-4 p-8 text-center"><SkillIcon skill={key(sec.skill)} /><h1 className="text-3xl font-bold">Next: {NAME[sec.skill]}</h1>
        {sec.skill === "SPEAKING" ? <><p className="text-muted-foreground">Make sure you’re somewhere you can speak aloud.</p>{micOk ? <span className="flex items-center gap-1 font-bold text-success"><Check className="size-4" />Microphone ready</span> : <Button variant="outline" onClick={checkMic}><Mic />Allow microphone</Button>}{micOk === false && <Notice tone="warning">No microphone access. You can continue and type what you said for each task afterwards.</Notice>}</>
          : <><p className="text-muted-foreground">The section starts automatically when the countdown ends.</p><p className="font-display text-4xl font-extrabold tabular-nums">{mmss(Math.ceil(betweenLeft))}</p></>}
        <Button size="lg" onClick={() => setPhase("item")} data-testid="start-section">Start {NAME[sec.skill]}</Button></Card></>);
  else if (phase === "transcripts") body = (
    <div className="space-y-4"><h1 className="text-3xl font-bold">Check your speaking transcripts</h1>
      <p className="max-w-[70ch] text-muted-foreground">Correct only speech-recognition errors, such as words the browser misheard. Leave your real mistakes in place so the estimate stays honest. If a transcript is empty, type what you said.</p>
      {results.map((r, i) => r.type === "speaking" ? (
        <Card key={i} className="space-y-2 p-5"><b>Speaking Task {(sections.flatMap((s) => s.items).find((x) => x.id === r.exerciseId)?.config as { task: number } | undefined)?.task}</b>
          <Textarea rows={4} value={r.transcript} data-testid="mock-transcript" onChange={(e) => setResults((all) => all.map((x, k) => (k === i && x.type === "speaking" ? { ...x, transcript: e.target.value } : x)))} /></Card>) : null)}
      <Button size="lg" onClick={() => submitAll(results)} data-testid="see-results">See my results</Button></div>);
  else if (phase === "submitting") body = <div className="space-y-4"><h1 className="text-3xl font-bold">Scoring your test…</h1><p className="text-muted-foreground">Rating writing and speaking can take a minute.</p><Skeleton className="h-24" /><div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div></div>;
  else if (item) {
    const k = `${si}-${ii}`;
    body = item.skill === "WRITING" ? <WritingItem key={k} item={item} untimed={untimed} onDone={onDone} bar={bar} />
      : item.skill === "SPEAKING" ? <SpeakingItem key={k} item={item} onDone={onDone} bar={bar} />
      : <ObjectiveItem key={k} item={item} untimed={untimed} onDone={onDone} bar={bar} />;
  }
  return <>{body}<ConfirmDialog open={exit} onOpenChange={setExit} destructive title="Exit the test?" description="Your progress in this test will be lost and nothing will be saved." confirmLabel="Exit test" cancelLabel="Keep going" onConfirm={leave} /></>;
}
