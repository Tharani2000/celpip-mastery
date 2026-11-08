import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { getPublicExercise } from "@/lib/services/content";
import { ReadingExercise, type ReadingEx } from "@/components/exercise/reading-exercise";
export default async function Page({ params }: { params: { id: string } }) {
  await requireUserId();
  const ex = await getPublicExercise(params.id);
  if (!ex || ex.skill !== "READING") notFound();
  return <ReadingExercise key={ex.id} ex={ex as unknown as ReadingEx} />;
}
