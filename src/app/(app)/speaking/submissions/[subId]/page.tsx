import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SpeakingFeedback } from "@/components/exercise/speaking-feedback";
import type { SpeakingEvaluation } from "@/lib/ai/schemas";
export default async function Page({ params }: { params: { subId: string } }) {
  const userId = await requireUserId();
  const s = await prisma.speakingSubmission.findFirst({ where: { id: params.subId, userId }, include: { exercise: true } });
  if (!s || !s.evaluation) notFound();
  const ev = s.evaluation as unknown as SpeakingEvaluation & { brief?: boolean; comment?: string };
  return (<div className="space-y-4">
    <div><Button variant="outline" size="sm" asChild><Link href="/speaking"><ChevronLeft />All speaking</Link></Button><h1 className="mt-3 text-3xl font-bold">{s.exercise.title}</h1></div>
    {ev.brief ? <Card className="space-y-3 p-5"><p className="font-display text-4xl font-extrabold">≈ {ev.level}</p><p className="text-muted-foreground">{ev.comment}</p>{s.audioPath && <audio controls src={`/api/audio/${s.id}`} className="w-full" />}<p className="passage">{s.transcript}</p></Card>
      : <SpeakingFeedback evaluation={ev} transcript={s.transcript} durationSec={s.durationSec} exerciseId={s.exerciseId} audioUrl={s.audioPath ? `/api/audio/${s.id}` : null} xp={s.xpAwarded} />}
  </div>);
}
