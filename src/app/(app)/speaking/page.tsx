import Link from "next/link";
import { Mic } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listExercises, } from "@/lib/services/content";
import { skillEstimates } from "@/lib/services/stats";
import { PageHeader, LevelBadge, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { serverTranscriptionAvailable } from "@/lib/ai/transcribe";
import type { SpeakingConfig } from "@/lib/content-types";

export const metadata = { title: "Speaking" };
export default async function Page() {
  const userId = await requireUserId();
  const [list, est, counts, subs] = await Promise.all([listExercises("SPEAKING", userId), skillEstimates(userId, 12), prisma.speakingSubmission.groupBy({ by: ["exerciseId"], where: { userId }, _count: true }), prisma.speakingSubmission.findMany({ where: { userId, estimatedLevel: { not: null } }, orderBy: { createdAt: "desc" }, take: 10, include: { exercise: { select: { taskType: true, config: true } } } })]);
  const cm = new Map(counts.map((c) => [c.exerciseId, c._count]));
  const tasks = [1, 2, 3, 4, 5, 6, 7, 8].map((t) => { const ps = list.filter((e) => (e.config as unknown as SpeakingConfig).task === t); const pick = [...ps].sort((a, b) => (cm.get(a.id) ?? 0) - (cm.get(b.id) ?? 0))[0]; const best = Math.max(0, ...ps.map((p) => p.bestLevel ?? 0)); return { t, ps, pick, best, cfg: pick.config as unknown as SpeakingConfig }; });
  return (<>
    <PageHeader title="Speaking" description="All eight CELPIP speaking tasks with official-style preparation and speaking timers. Your voice is recorded, transcribed and evaluated."><LevelBadge level={est[3].level} /></PageHeader>
    <Notice className="mb-5">Feedback is based on your transcript and timing. Pronunciation isn’t scored, because a transcript can’t show how you sound. {serverTranscriptionAvailable() ? "Recordings are transcribed on the server." : "Transcription uses your browser’s speech recognition (best in Chrome or Edge); you can correct it before submitting."}</Notice>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tasks.map(({ t, ps, pick, best, cfg }) => (
      <Link key={t} href={`/speaking/${pick.id}`} className="flex flex-col gap-2 rounded-[22px] border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple">
        <div className="flex justify-between"><span className="grid size-9 place-items-center rounded-xl bg-[#E0559B22] font-display font-extrabold text-[#E0559B]">{t}</span>{best ? <Badge variant="success">Best: level {best}</Badge> : <Badge>New</Badge>}</div>
        <h3 className="text-lg font-bold">{pick.taskType}</h3><p className="text-xs text-muted-foreground">{cfg.prep}s to prepare, {cfg.speak}s to speak{ps.length > 1 ? `, ${ps.length} prompts` : ""}</p>
      </Link>))}</div>
    <Card className="mt-8 p-5"><h2 className="text-xl font-bold">Your recordings</h2>
      {subs.length ? <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-2">Date</th><th>Task</th><th>Level</th><th /></tr></thead><tbody>{subs.map((s) => <tr key={s.id} className="border-t"><td className="py-2.5">{s.createdAt.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</td><td>{(s.exercise.config as unknown as SpeakingConfig).task}: {s.exercise.taskType}{s.fromMock && <Badge className="ml-2">Mock</Badge>}</td><td>{s.estimatedLevel}</td><td className="text-right"><Button size="sm" variant="outline" asChild><Link href={`/speaking/submissions/${s.id}`}>View feedback</Link></Button></td></tr>)}</tbody></table></div>
        : <EmptyState icon={<Mic className="size-10 text-purple" />} title="No recordings yet">Start with Task 1 to warm up.</EmptyState>}
    </Card>
  </>);
}
