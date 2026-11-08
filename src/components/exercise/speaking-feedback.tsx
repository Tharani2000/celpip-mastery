import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SpeakingEvaluation } from "@/lib/ai/schemas";
import { FILLERS } from "@/lib/text-analysis";
import { EvalHeader, Dimensions, Bullets, Fixes, Section, Fold, SampleText } from "./feedback-parts";

function markFillers(text: string) {
  const re = new RegExp(`\\b(${FILLERS.filter((f) => f !== "like").map((f) => f.replace(" ", "\\s")).join("|")})\\b`, "gi");
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i} className="rounded bg-warning/30 px-0.5">{part}</mark> : part));
}
export function SpeakingFeedback({ evaluation: ev, transcript, durationSec, exerciseId, audioUrl, xp, messages }: { evaluation: SpeakingEvaluation; transcript: string; durationSec: number; exerciseId: string; audioUrl?: string | null; xp?: number; messages?: string[] }) {
  const L = ev.local;
  return (
    <div className="space-y-4">
      <EvalHeader level={ev.level} mode={ev.mode} notice={ev.notice} xp={xp} messages={messages} />
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Ratings"><Dimensions scores={ev.scores} /><div className="grid grid-cols-[120px_1fr] gap-3 text-sm sm:grid-cols-[150px_1fr]"><span className="text-muted-foreground">Pronunciation</span><span className="text-muted-foreground">{ev.pronunciation.note}</span></div>{ev.summary && <p className="text-muted-foreground">{ev.summary}</p>}</Section>
        <Section title="Strengths and weaknesses"><Bullets items={ev.strengths} tone="good" /><div className="pt-2"><Bullets items={ev.weaknesses} tone="warn" /></div></Section>
      </div>
      <Section title="Transcript"><div className="flex flex-wrap gap-1.5"><Badge>{L.words} words</Badge><Badge>about {L.wordsPerMinute} per minute</Badge><Badge>{Math.round(durationSec)}s spoken</Badge></div>{audioUrl && <audio controls src={audioUrl} className="w-full" />}<p className="passage">{markFillers(transcript)}</p></Section>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Filler words and repetition">
          {L.fillers.length ? <><div className="flex flex-wrap gap-1.5">{L.fillers.map((f) => <Badge key={f.word} variant="warning">{f.word} × {f.count}</Badge>)}</div><p className="text-sm text-muted-foreground">{(L.fillerTotal / Math.max(durationSec, 10) * 60).toFixed(1)} fillers per minute. Band 10+ speakers usually stay under two.</p></> : <p className="text-sm text-muted-foreground">No common filler words detected.</p>}
          {L.repeated.length ? <><div className="flex flex-wrap gap-1.5">{L.repeated.map((r) => <Badge key={r.word}>{r.word} × {r.count}</Badge>)}</div><p className="text-sm text-muted-foreground">Swap some repetitions for synonyms or pronouns.</p></> : <p className="text-sm text-muted-foreground">No heavy repetition detected.</p>}
        </Section>
        <Section title="Grammar mistakes"><Fixes items={ev.grammarMistakes} a="original" b="corrected" why="explanation" /></Section>
      </div>
      <div className="grid gap-4 md:grid-cols-2"><Section title="Better alternatives"><Fixes items={ev.betterAlternatives} a="original" b="better" /></Section><Section title="Fluency tips"><Bullets items={ev.fluencyTips} tone="plan" /></Section></div>
      <Fold open title={ev.mode === "AI" ? "Model high-scoring response" : "What strong answers do"}><SampleText text={ev.modelResponse} /></Fold>
      <div className="flex flex-wrap gap-2"><Button asChild><Link href={`/speaking/${exerciseId}`}><RotateCcw />Try this task again</Link></Button><Button variant="outline" asChild><Link href="/speaking">Choose another task</Link></Button></div>
    </div>
  );
}
