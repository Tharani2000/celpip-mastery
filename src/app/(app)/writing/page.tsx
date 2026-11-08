import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listExercises } from "@/lib/services/content";
import { skillEstimates } from "@/lib/services/stats";
import { PageHeader, LevelBadge, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";
import type { WritingConfig } from "@/lib/content-types";

export const metadata = { title: "Writing" };
export default async function Page() {
  const userId = await requireUserId();
  const [list, est, drafts, subs] = await Promise.all([listExercises("WRITING", userId), skillEstimates(userId, 12), prisma.writingSubmission.findMany({ where: { userId, status: "DRAFT" }, select: { exerciseId: true } }), prisma.writingSubmission.findMany({ where: { userId, status: "EVALUATED" }, orderBy: { createdAt: "desc" }, take: 10, include: { exercise: { select: { title: true, config: true } } } })]);
  const draftSet = new Set(drafts.map((d) => d.exerciseId));
  const card = (e: (typeof list)[number]) => { const c = e.config as unknown as WritingConfig; return (
    <Link key={e.id} href={`/writing/${e.id}`} className="flex flex-col gap-2 rounded-[22px] border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple">
      <div className="flex justify-between"><Badge variant={c.task === 1 ? "cyan" : "primary"}>{c.task === 1 ? c.register ?? "Email" : "Survey"}</Badge>{draftSet.has(e.id) ? <Badge variant="warning">Draft saved</Badge> : e.bestLevel ? <Badge variant="success">Best: level {e.bestLevel}</Badge> : <Badge>New</Badge>}</div>
      <h3 className="text-lg font-bold">{e.title}</h3><p className="text-sm text-muted-foreground">{c.prompt.slice(0, 120)}…</p><p className="mt-auto text-xs text-muted-foreground">{c.minutes} minutes, {c.min}–{c.max} words</p>
    </Link>); };
  const t = (n: number) => list.filter((e) => (e.config as unknown as WritingConfig).task === n);
  return (<>
    <PageHeader title="Writing" description="Both CELPIP writing tasks, timed like the real test, with detailed feedback on six dimensions."><LevelBadge level={est[2].level} /></PageHeader>
    <h2 className="mb-3 text-xl font-bold">Task 1: Writing an Email <span className="font-sans text-sm font-normal text-muted-foreground">27 minutes</span></h2>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{t(1).map(card)}</div>
    <h2 className="mb-3 mt-8 text-xl font-bold">Task 2: Responding to Survey Questions <span className="font-sans text-sm font-normal text-muted-foreground">26 minutes</span></h2>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{t(2).map(card)}</div>
    <Card className="mt-8 p-5"><h2 className="text-xl font-bold">Your submissions</h2>
      {subs.length ? <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-2">Date</th><th>Prompt</th><th>Words</th><th>Level</th><th /></tr></thead><tbody>{subs.map((s) => <tr key={s.id} className="border-t"><td className="py-2.5">{s.createdAt.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</td><td>{s.exercise.title}{s.fromMock && <Badge className="ml-2">Mock</Badge>}</td><td>{s.wordCount}</td><td>{s.estimatedLevel ?? "—"}</td><td className="text-right"><Button size="sm" variant="outline" asChild><Link href={`/writing/submissions/${s.id}`}>View feedback</Link></Button></td></tr>)}</tbody></table></div>
        : <EmptyState icon={<PenLine className="size-10 text-purple" />} title="No submissions yet">Pick a prompt above to write your first response.</EmptyState>}
    </Card>
  </>);
}
