import { notFound, redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MockRunner } from "@/components/mock/mock-runner";
export const metadata = { title: "Mock test in progress" };
export default async function Page({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const a = await prisma.mockTestAttempt.findFirst({ where: { id: params.id, userId } });
  if (!a) notFound();
  if (a.status === "COMPLETED") redirect(`/mock/${a.id}/results`);
  if (a.status === "ABANDONED") redirect("/mock");
  return <MockRunner attemptId={a.id} label={a.label} untimed={a.untimed} />;
}
