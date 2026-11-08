import { redirect } from "next/navigation";
import { optionalUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelFromXp } from "@/lib/xp";
import { computeStreak } from "@/lib/gamification";
import { activityDate } from "@/lib/utils";
import { AppShell } from "@/components/shell/app-shell";

export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await optionalUserId();
  if (!userId) redirect("/login");
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/login");
  const days = await prisma.dailyActivity.findMany({ where: { userId, OR: [{ exercises: { gt: 0 } }, { vocabReviews: { gt: 0 } }] }, select: { date: true } });
  const lv = levelFromXp(profile.xp);
  return <AppShell header={{ level: lv.level, into: lv.into, need: lv.need, theme: profile.theme, xp: profile.xp, streak: computeStreak(days.map((d) => d.date), activityDate(new Date(), profile.timezone)) }}>{children}</AppShell>;
}
