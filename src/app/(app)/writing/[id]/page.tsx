import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDraft } from "@/lib/services/writing";
import { WritingWorkspace } from "@/components/exercise/writing-workspace";
import type { WritingConfig } from "@/lib/content-types";
export default async function Page({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const ex = await prisma.exercise.findFirst({ where: { id: params.id, skill: "WRITING", published: true } });
  if (!ex) notFound();
  const draft = await getDraft(userId, ex.id);
  return <WritingWorkspace key={ex.id} exerciseId={ex.id} title={ex.title} cfg={ex.config as unknown as WritingConfig} initialDraft={draft?.text ?? ""} />;
}
