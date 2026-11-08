import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { MockLauncher } from "@/components/mock/mock-launcher";
import { mmss } from "@/lib/utils";

export const metadata = { title: "Mock tests" };
export default async function Page() {
  const userId = await requireUserId();
  const [ex, history] = await Promise.all([prisma.exercise.findMany({ where: { published: true }, orderBy: [{ skill: "asc" }, { part: "asc" }, { slug: "asc" }], include: { _count: { select: { questions: true } } } }), prisma.mockTestAttempt.findMany({ where: { userId, status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 20 })]);
  const L = ex.filter((e) => e.skill === "LISTENING"), R = ex.filter((e) => e.skill === "READING");
  const W = [1, 2].map((t) => ex.find((e) => e.skill === "WRITING" && (e.config as { task: number }).task === t)!).filter(Boolean);
  const S = [1, 2, 3, 4, 5, 6, 7, 8].map((t) => ex.find((e) => e.skill === "SPEAKING" && (e.config as { task: number }).task === t)!).filter(Boolean);
  const q = (list: typeof ex) => list.reduce((n, e) => n + e._count.questions, 0);
  const options = [...L.map((e) => ({ id: e.id, label: `Part ${e.part}: ${e.title}`, group: "Listening parts" as const })), ...R.map((e) => ({ id: e.id, label: `Part ${e.part}: ${e.title}`, group: "Reading parts" as const })), ...W.map((e) => ({ id: e.id, label: `Task ${(e.config as { task: number }).task}: ${e.taskType}`, group: "Writing tasks" as const })), ...S.map((e) => ({ id: e.id, label: `Task ${(e.config as { task: number }).task}: ${e.taskType}`, group: "Speaking tasks" as const }))];
  const summary = [`Listening: ${L.length} parts, ${q(L)} questions; each recording plays once`, `Reading: ${R.length} parts, ${q(R)} questions`, "Writing: 2 tasks, 27 + 26 minutes", "Speaking: 8 tasks with official preparation and speaking times"];
  return (<>
    <PageHeader title="Mock tests" description="Exam conditions: timers run, recordings play once, and hints, explanations and feedback stay hidden until you finish." />
    <Notice className="mb-5">The structure follows the CELPIP General test (Listening 6 parts, Reading 4 parts, Writing 2 tasks, Speaking 8 tasks). Confirm the current official format at celpip.ca before test day. This question bank is shorter than the real test, so listening and reading timings are scaled to match. All results are unofficial practice estimates.</Notice>
    <MockLauncher options={options} summary={summary} />
    <Card className="mt-6 p-5"><h2 className="text-xl font-bold">Mock test history</h2>
      {history.length ? <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-2">Date</th><th>Type</th><th>Overall</th><th>L</th><th>R</th><th>W</th><th>S</th><th>Time</th><th /></tr></thead><tbody>{history.map((m) => <tr key={m.id} className="border-t"><td className="py-2.5">{m.completedAt?.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</td><td>{m.label}</td><td><b>{m.overallLevel ?? "—"}</b></td><td>{m.listeningLevel ?? "—"}</td><td>{m.readingLevel ?? "—"}</td><td>{m.writingLevel ?? "—"}</td><td>{m.speakingLevel ?? "—"}</td><td>{mmss(m.durationSec ?? 0)}</td><td className="text-right"><Button size="sm" variant="outline" asChild><Link href={`/mock/${m.id}/results`}>Results</Link></Button></td></tr>)}</tbody></table></div>
        : <EmptyState icon={<ClipboardCheck className="size-10 text-purple" />} title="No mock tests yet">A section-wise mock is a good first step.</EmptyState>}
    </Card>
  </>);
}
