import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WritingFeedback } from "@/components/exercise/writing-feedback";
import { FullFeedbackButton } from "@/components/exercise/full-feedback-button";
import type { WritingEvaluation } from "@/lib/ai/schemas";
export default async function Page({ params }: { params: { subId: string } }) {
  const userId = await requireUserId();
  const s = await prisma.writingSubmission.findFirst({ where: { id: params.subId, userId }, include: { exercise: true } });
  if (!s || !s.evaluation) notFound();
  const ev = s.evaluation as unknown as WritingEvaluation & { brief?: boolean; comment?: string };
  return (<div className="space-y-4">
    <div><Button variant="outline" size="sm" asChild><Link href="/writing"><ChevronLeft />All writing</Link></Button><p className="mt-3 text-sm text-muted-foreground">{s.createdAt.toLocaleDateString("en-CA", { dateStyle: "medium" })}</p><h1 className="text-3xl font-bold">{s.exercise.title}</h1></div>
    {ev.brief ? <Card className="space-y-3 p-5"><p className="font-display text-4xl font-extrabold">≈ {ev.level}</p><p className="text-muted-foreground">{ev.comment}</p><p className="text-sm">This rating came from a mock test. Request full feedback for corrections, upgrades and a sample answer.</p><FullFeedbackButton submissionId={s.id} /><div className="whitespace-pre-wrap rounded-xl border bg-secondary/50 p-4">{s.text}</div></Card>
      : <WritingFeedback evaluation={ev} text={s.text} words={s.wordCount} exerciseId={s.exerciseId} xp={s.xpAwarded} />}
  </div>);
}
