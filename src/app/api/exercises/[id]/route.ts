import { route, json } from "@/lib/api";
import { getPublicExercise } from "@/lib/services/content";
export const GET = route<{ id: string }>(async ({ params }) => {
  const ex = await getPublicExercise(params.id);
  return ex ? json({ exercise: ex }) : json({ error: "Exercise not found." }, 404);
});
