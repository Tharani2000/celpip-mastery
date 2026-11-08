"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/toaster";
import { api } from "@/lib/client";

export function SettingsClient({ initial, ai }: { initial: { ttsRate: number; aiMode: string; email: string }; ai: { configured: boolean; provider: string; transcription: boolean } }) {
  const { toast } = useToast(); const router = useRouter();
  const [rate, setRate] = useState(initial.ttsRate); const [aiMode, setAi] = useState(initial.aiMode); const [reset, setReset] = useState(false);
  const patch = async (data: object) => { try { await api("/api/profile", { method: "PATCH", json: data }); toast("Settings saved."); router.refresh(); } catch (e) { toast((e as Error).message, "error"); } };
  const test = () => { if (!("speechSynthesis" in window)) return toast("No speech engine in this browser.", "error"); speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance("This is how the listening recordings will sound. Is the speed comfortable?"); u.rate = rate; const v = speechSynthesis.getVoices().find((x) => /en-CA/i.test(x.lang)); if (v) u.voice = v; speechSynthesis.speak(u); };
  return (
    <div className="grid items-start gap-4 md:grid-cols-2">
      <Card className="space-y-3 p-5"><h2 className="text-xl font-bold">Listening audio</h2><label className="block text-sm font-bold">Speech speed: {rate.toFixed(2)}×<input className="mt-2 w-full accent-[hsl(var(--purple))]" type="range" min={0.8} max={1.2} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} onMouseUp={() => patch({ ttsRate: rate })} onTouchEnd={() => patch({ ttsRate: rate })} onKeyUp={() => patch({ ttsRate: rate })} /></label><Button variant="outline" onClick={test}><Volume2 />Test voice</Button><p className="text-xs text-muted-foreground">Applies to exercises without a recorded audio file.</p></Card>
      <Card className="space-y-3 p-5"><h2 className="text-xl font-bold">Writing and speaking feedback</h2>
        <Tabs value={aiMode} onValueChange={(v) => { setAi(v); void patch({ aiMode: v }); }}><TabsList><TabsTrigger value="auto">AI when available</TabsTrigger><TabsTrigger value="demo">Demo mode only</TabsTrigger></TabsList></Tabs>
        <Notice tone={ai.configured && aiMode !== "demo" ? "success" : "warning"}>{aiMode === "demo" ? "Demo mode is on: feedback is rule-based and clearly labelled." : ai.configured ? `AI feedback is configured (${ai.provider}).` : "No AI provider is configured on the server, so demo evaluations are used. Add an API key to .env to enable AI feedback."} {ai.transcription ? "Server speech-to-text is enabled." : "Speaking uses your browser’s transcript."}</Notice>
        <p className="text-sm text-muted-foreground">All levels are estimated practice feedback, never official CELPIP scores.</p></Card>
      <Card className="space-y-3 p-5"><h2 className="text-xl font-bold">Your data</h2><p className="text-sm text-muted-foreground">Signed in as {initial.email}.</p>
        <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><a href="/api/export"><Download />Export progress (JSON)</a></Button><Button variant="destructive" onClick={() => setReset(true)}>Reset all progress</Button></div></Card>
      <ConfirmDialog open={reset} onOpenChange={setReset} destructive title="Reset all progress?" description="This permanently deletes your attempts, XP, badges, vocabulary progress and mock tests. Your account and goals stay." confirmLabel="Reset everything" onConfirm={async () => { try { await api("/api/progress", { method: "DELETE" }); toast("Progress reset."); router.refresh(); } catch (e) { toast((e as Error).message, "error"); } }} />
    </div>
  );
}
