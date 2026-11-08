import { route, json } from "@/lib/api";
import { dashboardData } from "@/lib/services/stats";
import { aiStudyPlan } from "@/lib/ai/evaluate";
import { aiConfigured } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma";
export const POST = route(async ({ userId }) => {
  const d = await dashboardData(userId);
  const aiMode = (await prisma.userProfile.findUnique({ where: { userId }, select: { aiMode: true } }))?.aiMode;
  if (!aiConfigured() || aiMode === "demo") return json({ plan: null, fallback: d.plan, notice: "AI planning isn’t available, so this plan is built from your results." });
  const summary = `Target CELPIP ${d.target}. Daily study time ${d.dailyMinutes} minutes. Days to exam: ${d.daysToExam ?? "unknown"}.\nSkill estimates: ${d.estimates.map((e) => `${e.skill} ${e.level || "unmeasured"} (${e.count} done)`).join("; ")}.\nVocabulary cards due: ${d.dueWords}.`;
  const plan = await aiStudyPlan(summary);
  return json({ plan, fallback: d.plan, notice: plan ? null : "The AI plan couldn’t be generated, so this plan is built from your results." });
}, { ai: true });
