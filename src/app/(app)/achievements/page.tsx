import * as Icons from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { achievementsData } from "@/lib/services/stats";
import { PageHeader, SkillIcon } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SKILL_NAME } from "@/lib/content-types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Achievements" };
export default async function Page() {
  const a = await achievementsData(await requireUserId());
  const icon = (name: string) => (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Star;
  return (<div className="space-y-6">
    <PageHeader title="Achievements" description="XP rewards careful practice: no XP for rushed answers, copied responses or repeats without improvement." />
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="space-y-2 p-5"><div className="flex justify-between"><h3 className="font-bold">Level {a.level.level}</h3><Badge variant="primary"><Icons.Zap />{a.xp} XP</Badge></div><Progress value={(a.level.into / a.level.need) * 100} /><p className="text-sm text-muted-foreground">{a.level.need - a.level.into} XP to level {a.level.level + 1}</p></Card>
      <Card className="space-y-2 p-5"><div className="flex justify-between"><h3 className="font-bold">Weekly goal</h3><Badge variant={a.week.activeDays >= a.week.goalDays ? "success" : "default"}>{a.week.activeDays} of {a.week.goalDays} days</Badge></div><Progress value={(Math.min(a.week.activeDays, a.week.goalDays) / a.week.goalDays) * 100} /><p className="text-sm text-muted-foreground">{a.week.xp} XP and {a.week.exercises} exercises this week</p></Card>
      <Card className="space-y-2 p-5"><div className="flex justify-between"><h3 className="font-bold">Streak</h3><Badge variant="primary"><Icons.Flame />{a.streak} day{a.streak === 1 ? "" : "s"}</Badge></div><p className="text-sm text-muted-foreground">Best streak: {a.bestStreak} days. Practise anything today to keep it alive.</p></Card>
    </div>
    <div><h2 className="mb-3.5 text-2xl font-bold">Badges</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{a.badges.map((b) => { const I = b.earnedAt ? icon(b.icon) : Icons.Lock; return (
        <Card key={b.key} className={cn("flex flex-col items-center gap-2 p-5 text-center", !b.earnedAt && "opacity-85")}>
          <span className={cn("grid size-[72px] place-items-center rounded-[22px]", b.earnedAt ? "-rotate-3 text-white shadow-lg" : "bg-secondary text-muted-foreground")} style={b.earnedAt ? { background: "linear-gradient(140deg,#6B4EF0,#2F6BFF 60%,#13B5C6)" } : undefined}><I className="size-8" /></span>
          <h3 className="font-bold">{b.name}</h3><p className="text-sm text-muted-foreground">{b.description}</p>
          {b.earnedAt ? <Badge variant="success">Earned {new Date(b.earnedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</Badge> : <Badge>{b.progress ?? "Locked"}</Badge>}
        </Card>); })}</div></div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="space-y-2 p-5"><h3 className="text-lg font-bold">Skill milestones</h3>{a.milestones.map((m) => <div key={m.skill} className="flex items-center justify-between rounded-xl border bg-secondary/40 p-2.5"><span className="flex items-center gap-2"><SkillIcon skill={m.skill} className="size-8" /><b>{SKILL_NAME[m.skill]}</b></span><span className="flex gap-1.5">{[5, 10, 25].map((t) => <Badge key={t} variant={m.count >= t ? "success" : "default"}>{m.count >= t && <Icons.Check />}{t}</Badge>)}</span></div>)}</Card>
      <Card className="space-y-2 p-5"><h3 className="text-lg font-bold">Personal bests</h3><table className="w-full text-sm"><tbody>{a.personalBests.map((p) => <tr key={p.label + p.skill} className="border-t first:border-t-0"><td className="py-2">{p.label}</td><td className="text-muted-foreground">{SKILL_NAME[p.skill as "listening"]}</td><td className="text-right font-bold">{p.value === null ? "—" : `${p.value}${p.unit}`}</td></tr>)}</tbody></table></Card>
    </div>
  </div>);
}
