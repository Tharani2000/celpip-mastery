import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activityDate, dateKey } from "@/lib/utils";
import { getPlanView } from "@/lib/services/plan";
import { PageHeader } from "@/components/common";
import { PlanClient } from "@/components/plan/plan-client";

export const metadata = { title: "My Plan" };
export default async function Page() {
  const userId = await requireUserId();
  const [view, profile] = await Promise.all([getPlanView(userId), prisma.userProfile.findUnique({ where: { userId }, select: { timezone: true } })]);
  const today = dateKey(activityDate(new Date(), profile?.timezone));
  return (
    <>
      <PageHeader title="My Plan" description="A day-by-day study plan built from your goals. Change anything you like: swap exercises, add your own tasks, make rest days, or rebuild it with new settings." />
      <PlanClient initial={view} today={today} />
    </>
  );
}
