import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getProfile, learningHistory } from "@/lib/services/profile";
import { dashboardData } from "@/lib/services/stats";
import { prisma } from "@/lib/prisma";
import { PageHeader, SkillIcon, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/settings/profile-form";
import { Calendar } from "lucide-react";

export const metadata = { title: "Profile" };
export default async function Page() {
  const userId = await requireUserId();
  const [p, d, history, mocks] = await Promise.all([getProfile(userId), dashboardData(userId), learningHistory(userId, 15), prisma.mockTestAttempt.count({ where: { userId, status: "COMPLETED" } })]);
  return (<div className="space-y-5">
    <PageHeader title="Profile" description="Your goals shape your daily plan and recommendations." />
    <div className="grid items-start gap-4 md:grid-cols-2">
      <ProfileForm initial={{ displayName: p.displayName, targetScore: p.targetScore, examDate: p.examDate, dailyMinutes: p.dailyMinutes }} />
      <Card className="space-y-3 p-5"><h2 className="text-xl font-bold">Today’s plan</h2><p className="text-sm text-muted-foreground">{p.dailyMinutes} minutes, built from your weakest skills{d.daysToExam !== null ? ` and ${Math.max(0, d.daysToExam)} days to your exam` : ""}.</p>
        {d.plan.map((x) => <div key={x.title} className="flex items-center justify-between gap-3 rounded-xl border bg-secondary/40 p-3"><span><b>{x.title}</b><br /><span className="text-sm text-muted-foreground">{x.minutes} min</span></span><Button size="sm" variant="outline" asChild><Link href={x.href}>Start</Link></Button></div>)}</Card>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Completed mock tests", mocks], ["Total practice hours", d.totalHours], ["Current streak", `${d.streak} day${d.streak === 1 ? "" : "s"}`], ["Practising since", p.createdAt.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })]].map(([l, v]) => <Card key={String(l)} className="p-4"><p className="text-sm text-muted-foreground">{l}</p><b className="font-display text-2xl">{v}</b></Card>)}</div>
    <Card className="p-5"><h2 className="text-xl font-bold">Learning history</h2>
      {history.length ? <div className="mt-2">{history.map((h, i) => <div key={i} className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0"><span className="flex items-center gap-2.5"><SkillIcon skill={h.skill as "listening"} className="size-8" />{h.label}</span><span className="shrink-0 text-sm text-muted-foreground">{h.at.toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span></div>)}</div>
        : <EmptyState icon={<Calendar className="size-10 text-purple" />} title="Your sessions will be listed here" />}</Card>
  </div>);
}
