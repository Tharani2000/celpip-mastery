import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { getPublicExercise } from "@/lib/services/content";
import { getProfile } from "@/lib/services/profile";
import { ListeningExercise, type ListeningEx } from "@/components/exercise/listening-exercise";

export default async function Page({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const ex = await getPublicExercise(params.id);
  if (!ex || ex.skill !== "LISTENING") notFound();
  const profile = await getProfile(userId);
  return <ListeningExercise key={ex.id} ex={ex as unknown as ListeningEx} rate={profile.ttsRate} />;
}
