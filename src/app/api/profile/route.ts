import { route, json, body } from "@/lib/api";
import { profileSchema } from "@/lib/validation";
import { getProfile, updateProfile } from "@/lib/services/profile";
export const GET = route(async ({ userId }) => json({ profile: await getProfile(userId) }));
export const PATCH = route(async ({ userId, req }) => json({ profile: await updateProfile(userId, await body(req, profileSchema)) }));
