import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SpeakingPractice } from "@/components/exercise/speaking-practice";
import type { SpeakingConfig } from "@/lib/content-types";
export default async function Page({ params }: { params: { id: string } }) {
  await requireUserId();
  const ex = await prisma.exercise.findFirst({ where: { id: params.id, skill: "SPEAKING", published: true } });
  if (!ex) notFound();
  return <SpeakingPractice key={ex.id} exerciseId={ex.id} taskType={ex.taskType} cfg={ex.config as unknown as SpeakingConfig} />;
}
