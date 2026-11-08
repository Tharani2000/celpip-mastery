import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { MockResults } from "@/lib/services/mock";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Progress } from "@/components/ui/progress";
import { SkillIcon } from "@/components/common";
import { ReviewList } from "@/components/exercise/results-review";
import { Bullets, Fold } from "@/components/exercise/feedback-parts";
import { FullFeedbackButton } from "@/components/exercise/full-feedback-button";
import { LEVEL_DESC } from "@/lib/scoring";
import { mmss } from "@/lib/utils";
import { SKILLS, SKILL_NAME } from "@/lib/content-types";

export const metadata = { title: "Mock test results" };
export default async function Page({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const a = await prisma.mockTestAttempt.findFirst({ where: { id: params.id, userId, status: "COMPLETED" } });
  if (!a || !a.results) notFound();
  const r = a.results as unknown as MockResults;
  const levels = { listening: a.listeningLevel, reading: a.readingLevel, writing: a.writingLevel, speaking: a.speakingLevel };
  return (<div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-muted-foreground">{a.completedAt?.toLocaleDateString("en-CA", { dateStyle: "medium" })}</p><h1 className="text-3xl font-bold">{a.label} results</h1></div><Button variant="outline" asChild><Link href="/mock"><ChevronLeft />Mock tests</Link></Button></div>
    <Notice tone="warning">These are unofficial practice estimates, not CELPIP scores. Real results can differ, and nothing here guarantees an official outcome.{r.evalMode === "DEMO" && ` Writing and speaking were rated in demo mode: ${r.notice ?? ""}`}</Notice>
    <Card className="flex flex-wrap items-center gap-6 p-6"><div><div className="font-display text-6xl font-extrabold">{a.overallLevel ?? "—"}</div><p className="text-sm text-muted-foreground">estimated overall level</p></div><div><b>{a.overallLevel ? LEVEL_DESC[a.overallLevel] : ""}</b><p className="text-sm text-muted-foreground">Time taken: {mmss(a.durationSec ?? 0)}{a.xpAwarded ? `. Earned ${a.xpAwarded} XP.` : ""}</p></div></Card>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{SKILLS.map((s) => { const l = levels[s]; const o = r.sections[s as "listening"]; return (
      <Card key={s} className="space-y-2 p-4"><div className="flex justify-between"><SkillIcon skill={s} />{l ? <Badge variant="primary">≈ {l}</Badge> : <Badge>Not included</Badge>}</div><h3 className="font-bold">{SKILL_NAME[s]}</h3>
        {o ? <><p className="text-sm text-muted-foreground">{o.correct} of {o.total} correct ({o.percent}%)</p><Progress value={o.percent} className="h-1.5" /></> : l ? <p className="text-sm text-muted-foreground">{(s === "writing" ? r.writing : r.speaking).length} task(s) rated</p> : null}</Card>); })}</div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="space-y-3 p-5"><h3 className="text-lg font-bold">Skill analysis by question type</h3>{r.categories.length ? r.categories.map((c) => <div key={c.key} className="grid grid-cols-[150px_1fr_40px] items-center gap-3 text-sm"><span className="text-muted-foreground">{c.name}</span><Progress value={c.percent} /><b className="text-right font-display">{c.percent}%</b></div>) : <p className="text-sm text-muted-foreground">No listening or reading in this test.</p>}</Card>
      <Card className="space-y-3 p-5"><h3 className="text-lg font-bold">Areas requiring improvement</h3><Bullets tone="warn" items={r.improvements.length ? r.improvements : ["No major weaknesses stood out. Keep practising under timed conditions."]} />
        <h3 className="pt-2 text-lg font-bold">Recommended practice</h3><div className="flex flex-wrap gap-2">{r.recommended.length ? r.recommended.slice(0, 8).map((x) => <Button key={x.href} size="sm" variant="outline" asChild><Link href={x.href}>{x.label}</Link></Button>) : <span className="text-sm text-muted-foreground">Nothing specific. Try a full mock next.</span>}</div></Card>
    </div>
    {r.objective.map((o) => <Fold key={o.exerciseId} title={`Review ${o.skill === "listening" ? "Listening" : "Reading"} Part ${o.part}: ${o.correct}/${o.total} correct`}><ReviewList review={o.review} /></Fold>)}
    {r.writing.map((w) => <Fold key={w.exerciseId} title={`Writing Task ${w.task}: ${w.title} (≈ ${w.level})`}><div className="space-y-3"><p className="text-muted-foreground">{w.comment}</p><div className="whitespace-pre-wrap rounded-xl border bg-secondary/50 p-4">{w.text || "(no response)"}</div>{w.words >= 30 && <FullFeedbackButton submissionId={w.submissionId} />}</div></Fold>)}
    {r.speaking.map((s) => <Fold key={s.exerciseId} title={`Speaking Task ${s.task}: ${s.type} (≈ ${s.level})`}><div className="space-y-3"><p className="text-muted-foreground">{s.comment}</p>{s.hasAudio && s.submissionId && <audio controls src={`/api/audio/${s.submissionId}`} className="w-full" />}<p className="passage">{s.transcript || "(nothing transcribed)"}</p></div></Fold>)}
  </div>);
}
