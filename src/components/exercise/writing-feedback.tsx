import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WritingEvaluation } from "@/lib/ai/schemas";
import { EvalHeader, Dimensions, Bullets, Fixes, Section, Fold, SampleText } from "./feedback-parts";

export function WritingFeedback({ evaluation: ev, text, words, exerciseId, xp, messages }: { evaluation: WritingEvaluation; text: string; words: number; exerciseId: string; xp?: number; messages?: string[] }) {
  return (
    <div className="space-y-4">
      <EvalHeader level={ev.level} mode={ev.mode} notice={ev.notice} xp={xp} messages={messages} />
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Dimension ratings"><Dimensions scores={ev.scores} />{ev.summary && <p className="text-muted-foreground">{ev.summary}</p>}</Section>
        <Section title="Strengths and weaknesses"><Bullets items={ev.strengths} tone="good" /><div className="pt-2"><Bullets items={ev.weaknesses} tone="warn" /></div></Section>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Grammar corrections"><Fixes items={ev.grammarCorrections} a="original" b="corrected" why="explanation" /></Section>
        <Section title="Vocabulary upgrades"><Fixes items={ev.vocabularySuggestions} a="original" b="suggestion" why="why" /></Section>
      </div>
      <Section title="Sentence restructuring"><Fixes items={ev.restructuring} a="original" b="improved" /></Section>
      <Section title="What to do next"><Bullets items={ev.recommendations} tone="plan" /></Section>
      <Fold open title={ev.mode === "AI" ? "High-scoring sample response" : "Band 11+ structure"}><SampleText text={ev.sampleResponse} /></Fold>
      <Fold title={`Your response (${words} words)`}><SampleText text={text} /></Fold>
      <div className="flex flex-wrap gap-2"><Button asChild><Link href={`/writing/${exerciseId}`}><RotateCcw />Rewrite this prompt</Link></Button><Button variant="outline" asChild><Link href="/writing">Choose another prompt</Link></Button></div>
    </div>
  );
}
