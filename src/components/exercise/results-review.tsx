"use client";
import { useState } from "react";
import Link from "next/link";
import { RotateCcw, Zap, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { LevelBadge, EstimateLabel } from "@/components/common";
import { CATEGORY_NAME, type ReviewItem } from "@/lib/content-types";
import { cn } from "@/lib/utils";

export type PracticeResult = { correct: number; total: number; percent: number; level: number; review: ReviewItem[]; xp: number; messages: string[] };

export function ReviewList({ review, onlyWrong }: { review: ReviewItem[]; onlyWrong?: boolean }) {
  const items = review.filter((r) => !onlyWrong || !r.isCorrect);
  if (!items.length) return <Card className="p-8 text-center text-muted-foreground">No incorrect answers. Excellent work.</Card>;
  return <div className="flex flex-col gap-3">{items.map((r, idx) => (
    <article key={r.id} className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><b>Question {r.order}</b><div className="flex gap-1.5"><Badge>{CATEGORY_NAME[r.category] ?? r.category}</Badge><Badge variant={r.isCorrect ? "success" : "destructive"}>{r.isCorrect ? "Correct" : r.chosenOptionId ? "Incorrect" : "Unanswered"}</Badge></div></div>
      <p className="mb-3 mt-2 font-bold">{r.text}</p>
      <div className="flex flex-col gap-1.5">{r.options.map((o) => (
        <div key={o.id} className={cn("flex items-start gap-3 rounded-xl border-[1.5px] p-3", o.id === r.correctOptionId && "border-success bg-success/10", o.id === r.chosenOptionId && o.id !== r.correctOptionId && "border-destructive bg-destructive/10")}>
          <span className={cn("grid size-6 shrink-0 place-items-center rounded-md bg-secondary text-xs font-extrabold", o.id === r.correctOptionId && "bg-success text-white", o.id === r.chosenOptionId && o.id !== r.correctOptionId && "bg-destructive text-white")}>{o.label}</span><span>{o.text}</span></div>))}</div>
      <p className="mt-3 rounded-xl bg-secondary/70 p-3 text-sm text-muted-foreground">{r.explanation}</p>
      <span className="sr-only">{idx}</span>
    </article>))}</div>;
}

export function ResultsPanel({ result, timeUp, backHref, onRetry, extra }: { result: PracticeResult; timeUp?: boolean; backHref: string; onRetry: () => void; extra?: React.ReactNode }) {
  const [onlyWrong, setOnlyWrong] = useState(false);
  return (
    <div className="space-y-4">
      <Card className="p-6">
        {timeUp && <Notice tone="warning" className="mb-4"><Clock className="hidden" />Time ran out, so your answers were submitted automatically.</Notice>}
        <div className="flex flex-wrap items-center gap-6">
          <div className="grid size-24 place-items-center rounded-full" style={{ background: `conic-gradient(hsl(var(--purple)) ${result.percent}%, hsl(var(--secondary)) 0)` }}><span className="grid size-[78px] place-items-center rounded-full bg-card font-display text-xl font-extrabold">{result.percent}%</span></div>
          <div className="space-y-1.5"><div className="font-display text-5xl font-extrabold">{result.correct}<span className="text-2xl text-muted-foreground">/{result.total}</span></div><div className="flex flex-wrap gap-1.5"><LevelBadge level={result.level} /><EstimateLabel /></div></div>
          <div className="ml-auto min-w-[200px] space-y-1.5">{result.xp > 0 && <Badge variant="success"><Zap />+{result.xp} XP</Badge>}{result.messages.map((m) => <p key={m} className="text-sm text-muted-foreground">{m}</p>)}</div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setOnlyWrong(!onlyWrong)}>{onlyWrong ? "Show all questions" : "Show only incorrect"}</Button>{extra}
          <Button variant="outline" size="sm" onClick={onRetry}><RotateCcw />Try again</Button><Button size="sm" asChild><Link href={backHref}>Back to list</Link></Button>
        </div>
      </Card>
      <ReviewList review={result.review} onlyWrong={onlyWrong} />
    </div>
  );
}
