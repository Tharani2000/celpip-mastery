import { requireUserId } from "@/lib/auth";
import { getProfile } from "@/lib/services/profile";
import { getAIConfig } from "@/lib/ai/provider";
import { serverTranscriptionAvailable } from "@/lib/ai/transcribe";
import { PageHeader } from "@/components/common";
import { SettingsClient } from "@/components/settings/settings-client";
export const metadata = { title: "Settings" };
export default async function Page() {
  const p = await getProfile(await requireUserId()); const cfg = getAIConfig();
  return <><PageHeader title="Settings" description="Audio, feedback and your data." /><SettingsClient initial={{ ttsRate: p.ttsRate, aiMode: p.aiMode, email: p.email }} ai={{ configured: cfg.provider !== "demo", provider: cfg.provider === "demo" ? "none" : `${cfg.provider}, ${cfg.model}`, transcription: serverTranscriptionAvailable() }} /></>;
}
