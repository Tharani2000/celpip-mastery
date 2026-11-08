import { requireUserId } from "@/lib/auth";
import { listExercises } from "@/lib/services/content";
import { skillEstimates } from "@/lib/services/stats";
import { PageHeader, LevelBadge } from "@/components/common";
import { ExerciseGrid, bestTone } from "@/components/exercise/exercise-list";
import type { ReadingPassage } from "@/lib/content-types";

export const metadata = { title: "Reading" };
export default async function Page() {
  const userId = await requireUserId();
  const [list, est] = await Promise.all([listExercises("READING", userId), skillEstimates(userId, 12)]);
  return (<>
    <PageHeader title="Reading" description="Four parts with nuanced passages. Select text to highlight evidence while you work."><LevelBadge level={est[1].level} /></PageHeader>
    <ExerciseGrid cols={2} color="#6B4EF0" items={list.map((e) => { const p = e.passage as unknown as ReadingPassage; const first = p.paragraphs.find((x) => !x.startsWith("Subject:") && x.length > 40) ?? p.paragraphs[0]; return { id: e.id, href: `/reading/${e.id}`, number: e.part, eyebrow: e.taskType, title: e.title, blurb: `${first.replace(/^[A-D]\. /, "").slice(0, 130)}…`, meta: [`${e.questionCount} questions`, `${Math.round((e.timeLimitSec ?? 600) / 60)} min`], best: e.bestPercent !== null ? `Best ${e.bestPercent}%` : null, bestTone: e.bestPercent !== null ? bestTone(e.bestPercent) : undefined }; })} />
  </>);
}
