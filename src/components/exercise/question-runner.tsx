"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PublicQuestion } from "@/lib/content-types";
import { TimerChip } from "./timer";

export type Answers = Record<string, string | null>;

/** Objective question navigator used by practice and mock modes. Keyboard: A–E to answer, arrows to move. */
export function QuestionRunner({ questions, answers, onAnswer, onSubmit, timeLeft, exam, instructions }: { questions: PublicQuestion[]; answers: Answers; onAnswer: (qid: string, oid: string) => void; onSubmit: () => void; timeLeft?: number | null; exam?: boolean; instructions?: string | null }) {
  const [i, setI] = useState(0); const [confirm, setConfirm] = useState(false);
  const q = questions[i]; const missing = questions.filter((x) => !answers[x.id]).length;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      const k = "abcde".indexOf(e.key.toLowerCase()); if (k >= 0 && q.options[k]) onAnswer(q.id, q.options[k].id);
      if (e.key === "ArrowRight") setI((n) => Math.min(questions.length - 1, n + 1)); if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [q, questions.length, onAnswer]);
  const pick = (oid: string) => { onAnswer(q.id, oid); if (!exam && i < questions.length - 1) setTimeout(() => setI((n) => Math.min(questions.length - 1, n + 1)), 260); };
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Questions">{questions.map((x, n) => (
          <button key={x.id} onClick={() => setI(n)} aria-label={`Question ${n + 1}${answers[x.id] ? ", answered" : ""}`} aria-current={n === i}
            className={cn("size-9 rounded-xl border font-display font-extrabold", answers[x.id] && "border-blue bg-blue/15 text-blue", n === i && "ring-2 ring-purple ring-offset-1 ring-offset-card")}>{n + 1}</button>))}
        </div>
        {typeof timeLeft === "number" && <TimerChip left={timeLeft} />}
      </div>
      {instructions && <p className="mt-3 text-sm text-muted-foreground">{instructions}</p>}
      <p className="mt-4 text-sm text-muted-foreground">Question {i + 1} of {questions.length}</p>
      <h3 className="mb-3.5 mt-1 font-sans text-[1.08rem] font-bold leading-snug">{q.text}</h3>
      <div role="radiogroup" className="flex flex-col gap-2">{q.options.map((o) => {
        const on = answers[q.id] === o.id;
        return <button key={o.id} role="radio" aria-checked={on} onClick={() => pick(o.id)} className={cn("flex w-full items-start gap-3 rounded-2xl border-[1.5px] bg-card p-3.5 text-left leading-snug hover:bg-secondary/60", on && "border-purple bg-accent")}>
          <span className={cn("grid size-[26px] shrink-0 place-items-center rounded-lg bg-secondary text-sm font-extrabold", on && "bg-purple text-white")}>{o.label}</span><span>{o.text}</span></button>; })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2"><Button variant="outline" size="sm" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft />Previous</Button><Button variant="outline" size="sm" disabled={i === questions.length - 1} onClick={() => setI(i + 1)}>Next<ChevronRight /></Button></div>
        <Button onClick={() => setConfirm(true)} data-testid="submit-answers">{exam ? "Submit part" : "Submit answers"}</Button>
      </div>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={exam ? "Submit this part?" : "Submit your answers?"} confirmLabel="Submit"
        description={missing ? `You have ${missing} unanswered question${missing === 1 ? "" : "s"}. Unanswered questions are marked incorrect.` : exam ? "You won’t be able to return to this part." : "You’ll see your score and explanations next."} onConfirm={onSubmit} />
    </div>
  );
}
