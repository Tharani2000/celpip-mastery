import { route, json, body } from "@/lib/api";
import { attemptSchema } from "@/lib/validation";
import { submitPractice } from "@/lib/services/practice";
export const POST = route(async ({ userId, req }) => json(await submitPractice(userId, await body(req, attemptSchema)), 201));
