import { route, json, body } from "@/lib/api";
import { planDaysSchema, planSettingsSchema } from "@/lib/validation";
import { createPlan, deletePlan, getPlanView, savePlanDays } from "@/lib/services/plan";
import type { PlanDay } from "@/lib/plan";
import { z } from "zod";

export const GET = route(async ({ userId }) => json(await getPlanView(userId)));
/** Generate (or regenerate) the plan from settings. */
export const POST = route(async ({ userId, req }) => json(await createPlan(userId, await body(req, planSettingsSchema))));
/** Save hand edits to the days. */
export const PUT = route(async ({ userId, req }) => { const { days } = await body(req, z.object({ days: planDaysSchema })); await savePlanDays(userId, days as PlanDay[]); return json({ ok: true }); });
export const DELETE = route(async ({ userId }) => { await deletePlan(userId); return json({ ok: true }); });
