import { route } from "@/lib/api";
import { exportData } from "@/lib/services/profile";
export const GET = route(async ({ userId }) => new Response(JSON.stringify(await exportData(userId), null, 2), { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="pra-win-${new Date().toISOString().slice(0, 10)}.json"` } }));
