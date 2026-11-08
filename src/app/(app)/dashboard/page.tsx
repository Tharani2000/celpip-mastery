import Link from "next/link";
import { Flame, Check, Play } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { dashboardData } from "@/lib/services/stats";
import { LEVEL_DESC } from "@/lib/scoring";
import { SKILLS, SKILL_NAME } from "@/lib/content-types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SkillIcon } from "@/components/common";
import { LevelLadder } from "@/components/dashboard/ladder";
import { AiPlanButton } from "@/components/dashboard/ai-plan";

export const metadata = { title: "Dashboard" };
export default async function Page() {
  const d = await dashboardData(await requireUserId());
  const h = new Date().getHours(); const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const levels = Object.fromEntries(d.estimates.map((e) => [e.skill, e.level]));
  const ch = d.challenge; const chHref = ch.skill === "vocabulary" ? "/vocabulary" : ch.skill === "any" ? "/listening" : `/${ch.skill}/${d.next[ch.skill as "listening"].exerciseId}`;
  return (<div className="stagger space-y-6">
    <section className="hero-gradient relative grid gap-7 overflow-hidden rounded-[28px] p-6 text-white shadow-2xl md:grid-cols-[1.1fr_1fr] md:p-7">
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(19,181,198,.45), transparent 70%)" }} />
      <div className="relative z-[1] flex flex-col">
        <p className="text-[#C9D2FF]">{greet}{d.name ? `, ${d.name.split(" ")[0]}` : ""}</p>
        <h1 className="mt-1.5 text-3xl font-extrabold md:text-[2.6rem] md:leading-[1.08]">{d.overallLevel ? `You’re climbing at level ${d.overallLevel}. Target: ${d.target}.` : `Let’s find your starting level. Target: ${d.target}.`}</h1>
        <p className="mt-2.5 max-w-[46ch] text-[#C9D2FF]">{d.overallLevel ? `${LEVEL_DESC[d.overallLevel]}. Overall preparation is ${d.overallProgress}% of the way to your target.` : "Complete one exercise in each skill and your estimated levels will appear on the ladder."}</p>
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {[[d.streak, "day streak"], [d.totalHours, "hours practised"], [d.daysToExam === null ? "—" : Math.max(0, d.daysToExam), d.daysToExam === null ? "set exam date" : "days to exam"]].map(([v, l]) => <div key={String(l)} className="rounded-2xl border border-white/15 bg-white/10 p-3"><b className="block font-display text-2xl">{v}</b>{l === "set exam date" ? <Link href="/profile" className="text-xs text-[#7FF0FA] underline">{l}</Link> : <span className="text-xs text-[#C9D2FF]">{l}</span>}</div>)}
        </div>
        <div className="mt-auto pt-5"><div className="flex justify-between text-xs text-[#C9D2FF]"><span>Today: {d.todayMinutes} of {d.dailyMinutes} min</span><span>{d.todayMinutes >= d.dailyMinutes ? "Daily goal met" : `${d.dailyMinutes - d.todayMinutes} min to go`}</span></div><Progress value={(d.todayMinutes / d.dailyMinutes) * 100} className="mt-1.5 bg-white/15" /></div>
      </div>
      <LevelLadder levels={levels} target={d.target} />
    </section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[["Exercises completed", d.exerciseCount], ["Avg. listening and reading score", d.avgPercent === null ? "—" : `${d.avgPercent}%`], ["Estimated overall level", d.overallLevel || "—"], ["Experience", `${d.xp} XP`]].map(([l, v]) => <Card key={String(l)} className="hover-lift p-4"><p className="text-sm text-muted-foreground">{l}</p><b className="font-display text-2xl">{v}</b>{l === "Experience" && <p className="text-xs text-muted-foreground">Level {d.xpLevel.level}</p>}</Card>)}
    </div>
    <div className="flex flex-wrap items-center gap-4 rounded-[22px] border-[1.5px] border-dashed border-purple bg-accent p-5">
      <span className="grid size-12 place-items-center rounded-2xl bg-card text-purple">{ch.claimed ? <Check className="animate-pop" /> : <Flame className="animate-flicker" />}</span>
      <div className="flex-1"><h3 className="font-bold">Today’s challenge</h3><p>{ch.text}</p><p className="text-sm text-muted-foreground">{ch.claimed ? "Complete. +25 XP earned." : `${ch.progress}. Worth 25 XP.`}</p></div>
      {ch.claimed ? <Badge variant="success">Done</Badge> : <Button asChild><Link href={chHref}>Start</Link></Button>}
    </div>
    <div><h2 className="mb-3.5 text-2xl font-bold">Your four skills</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{SKILLS.map((s) => { const e = d.estimates.find((x) => x.skill === s)!; const n = d.next[s]; return (
        <Card key={s} className="hover-lift flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between"><SkillIcon skill={s} /><Badge>{e.count} done</Badge></div>
          <div><h3 className="font-bold">{SKILL_NAME[s]}</h3><div className="mt-1 flex items-baseline gap-2"><span className="font-display text-4xl font-extrabold">{e.level || "—"}</span><span className="text-sm text-muted-foreground">of {e.target} target</span></div></div>
          <div><div className="flex justify-between text-xs text-muted-foreground"><span>Progress to target</span><span>{e.progress}%</span></div><Progress value={e.progress} className="mt-1 h-1.5" /></div>
          <div className="rounded-xl border bg-secondary/50 px-3 py-2"><p className="text-xs text-muted-foreground">Recommended next</p><p className="text-sm font-bold">{n.label}</p></div>
          <Button asChild><Link href={`/${s}/${n.exerciseId}`}><Play />Start</Link></Button>
        </Card>); })}</div></div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="space-y-3 p-5"><h2 className="text-xl font-bold">Recommended for you</h2>{d.recommendations.map((r) => <div key={r.text} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-secondary/40 p-3"><p className="min-w-[220px] flex-1">{r.text}</p><Button size="sm" variant="outline" asChild><Link href={r.href}>{r.cta}</Link></Button></div>)}<AiPlanButton /></Card>
      <Card className="flex flex-col justify-between gap-4 p-5"><p className="text-sm text-muted-foreground">Thought for {new Date().toLocaleDateString("en-CA", { weekday: "long" })}</p><p className="max-w-[46ch] font-display text-xl font-semibold leading-snug">“{d.quote}”</p><div className="flex gap-2"><Button variant="outline" asChild><Link href="/mock">Mock tests</Link></Button><Button variant="outline" asChild><Link href="/vocabulary">Word of the day</Link></Button></div></Card>
    </div>
  </div>);
}
