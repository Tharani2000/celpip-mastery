import { requireUserId } from "@/lib/auth";
import { listExercises } from "@/lib/services/content";
import { skillEstimates } from "@/lib/services/stats";
import { PageHeader, LevelBadge } from "@/components/common";
import { ExerciseGrid, bestTone } from "@/components/exercise/exercise-list";
import { Notice } from "@/components/ui/notice";
import { wordCount } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ListeningScript } from "@/lib/content-types";

export const metadata = { title: "Listening" };
export default async function Page() {
  const userId = await requireUserId();
  const [list, est, scripts] = await Promise.all([listExercises("LISTENING", userId), skillEstimates(userId, 12), prisma.exercise.findMany({ where: { skill: "LISTENING" }, select: { id: true, script: true } })]);
  const mins = (id: string) => { const s = scripts.find((x) => x.id === id)?.script as ListeningScript | undefined; return s ? Math.ceil(s.lines.reduce((n, l) => n + wordCount(l[1]) / 2.55 + 0.35, 0) / 60) : 2; };
  return (<>
    <PageHeader title="Listening" description="Six parts modelled on the CELPIP General test. In practice you can replay each recording; in mock tests it plays once."><LevelBadge level={est[0].level} /></PageHeader>
    <Notice className="mb-5">Each part tests main ideas, details, speaker intentions, implied meaning, tone and viewpoints. Questions are timed once the recording ends.</Notice>
    <ExerciseGrid items={list.map((e) => ({ id: e.id, href: `/listening/${e.id}`, number: e.part, eyebrow: e.taskType, title: e.title, blurb: e.context ?? "", meta: [`${e.questionCount} questions`, `About ${mins(e.id)} min audio`, `${e.maxPlays ?? 2} plays`], best: e.bestPercent !== null ? `Best ${e.bestPercent}%` : null, bestTone: e.bestPercent !== null ? bestTone(e.bestPercent) : undefined }))} />
  </>);
}
