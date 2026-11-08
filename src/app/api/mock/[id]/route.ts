import { route, json } from "@/lib/api";
import { getMockSession } from "@/lib/services/mock";
import { prisma } from "@/lib/prisma";
export const GET = route<{ id: string }>(async ({ userId, params }) => json(await getMockSession(userId, params.id)));
export const DELETE = route<{ id: string }>(async ({ userId, params }) => { await prisma.mockTestAttempt.updateMany({ where: { id: params.id, userId, status: "IN_PROGRESS" }, data: { status: "ABANDONED" } }); return json({ ok: true }); });
