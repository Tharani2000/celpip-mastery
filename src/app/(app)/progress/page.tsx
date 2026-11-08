import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { analyticsData, dashboardData } from "@/lib/services/stats";
import { PageHeader, SkillIcon } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LevelTrend, HBar, MinutesChart } from "@/components/charts/progress-charts";
import { SKILL_NAME } from "@/lib/content-types";
import { mmss } from "@/lib/utils";

export const metadata = { title: "My progress" };
const COLORS: Record<string, string> = { listening: "#2F6BFF", reading: "#6B4EF0", writing: "#13B5C6", speaking: "#E0559B" };
export default async function Page() {
  const userId = await requireUserId();
  const [a, d] = await Promise.all([analyticsData(userId), dashboardData(userId)]);
  const v = a.vocab; const vt = v.NEW + v.LEARNING + v.REVIEW + v.MASTERED || 1;
  return (<div className="space-y-5">
    <PageHeader title="My progress" description="Estimated levels, accuracy and habits across every practice session and mock test." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[["Overall accuracy", a.kpis.accuracy === null ? "—" : `${a.kpis.accuracy}%`, `${a.kpis.correct} of ${a.kpis.total} questions`], ["Practice time", `${a.kpis.hours} h`, `${a.kpis.activeDays} active days`], ["Avg. exercise time", a.kpis.avgSeconds ? mmss(a.kpis.avgSeconds) : "—", "listening and reading"], ["Mock tests", a.kpis.mocks, `best streak ${a.bestStreak} days`]].map(([l, val, s]) => <Card key={String(l)} className="p-4"><p className="text-sm text-muted-foreground">{l}</p><b className="font-display text-2xl">{val}</b><p className="text-xs text-muted-foreground">{s}</p></Card>)}
    </div>
    <LevelTrend timeline={a.timeline} />
    <div className="grid gap-4 md:grid-cols-2">
      <HBar title="Skill-wise progress to target" data={a.estimates.map((e) => ({ name: SKILL_NAME[e.skill], value: e.progress, color: COLORS[e.skill] }))} />
      <HBar title="Accuracy by question type" note="Weakest first" data={a.categories.map((c) => ({ name: c.name, value: c.percent }))} />
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <HBar title="Average completion time" note="Minutes per exercise, practice mode" unit=" min" max={Math.max(1, ...a.times.map((t) => t.minutes))} data={a.times.map((t) => ({ name: t.type, value: t.minutes, color: "#13B5C6" }))} />
      <Card className="space-y-3 p-5"><h3 className="text-lg font-bold">Vocabulary mastery</h3>
        <div className="flex h-4 overflow-hidden rounded-full bg-secondary">{([["MASTERED", "bg-success"], ["REVIEW", "bg-blue"], ["LEARNING", "bg-warning"]] as const).map(([k, c]) => <div key={k} className={c} style={{ width: `${(v[k] / vt) * 100}%` }} title={`${v[k]} ${k.toLowerCase()}`} />)}</div>
        <div className="flex flex-wrap gap-1.5"><Badge variant="success">{v.MASTERED} mastered</Badge><Badge variant="blue">{v.REVIEW} review</Badge><Badge variant="warning">{v.LEARNING} learning</Badge><Badge>{v.NEW} new</Badge></div><p className="text-sm text-muted-foreground">{d.dueWords} card{d.dueWords === 1 ? "" : "s"} due now.</p></Card>
    </div>
    <MinutesChart data={a.last14} />
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="space-y-2 p-5"><h3 className="text-lg font-bold">Improvement trends</h3><p className="text-xs text-muted-foreground">Average of your first attempts versus your latest</p>{a.trend.map((t) => <div key={t.skill} className="flex items-center justify-between rounded-xl border bg-secondary/40 p-2.5"><span className="flex items-center gap-2"><SkillIcon skill={t.skill} className="size-8" /><b>{SKILL_NAME[t.skill]}</b></span><span className="flex items-center gap-2 text-sm text-muted-foreground">{t.from === null ? "Not enough data" : `${t.from} → ${t.to}`}{t.delta !== 0 && <Badge variant={t.delta > 0 ? "success" : "destructive"}>{t.delta > 0 ? "+" : ""}{t.delta}</Badge>}</span></div>)}</Card>
      <Card className="space-y-2 p-5"><h3 className="text-lg font-bold">Mock test history</h3>{a.mocks.length ? <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-1.5">Date</th><th>Type</th><th>Overall</th><th>L</th><th>R</th><th>W</th><th>S</th></tr></thead><tbody>{a.mocks.map((m) => <tr key={m.id} className="border-t"><td className="py-2"><Link className="underline" href={`/mock/${m.id}/results`}>{m.completedAt ? new Date(m.completedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" }) : ""}</Link></td><td>{m.label}</td><td><b>{m.overallLevel ?? "—"}</b></td><td>{m.listeningLevel ?? "—"}</td><td>{m.readingLevel ?? "—"}</td><td>{m.writingLevel ?? "—"}</td><td>{m.speakingLevel ?? "—"}</td></tr>)}</tbody></table> : <div className="py-6 text-center text-muted-foreground"><p>No mock tests yet.</p><Button asChild variant="outline" className="mt-2"><Link href="/mock">Take one</Link></Button></div>}</Card>
    </div>
    <Card className="space-y-3 p-5"><h2 className="text-xl font-bold">Personalized recommendations</h2>{d.recommendations.map((r) => <div key={r.text} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-secondary/40 p-3"><p className="flex-1">{r.text}</p><Button size="sm" variant="outline" asChild><Link href={r.href}>{r.cta}</Link></Button></div>)}</Card>
  </div>);
}
