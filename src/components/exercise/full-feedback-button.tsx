"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toaster";
import { api } from "@/lib/client";
export function FullFeedbackButton({ submissionId }: { submissionId: string }) {
  const [busy, setBusy] = useState(false); const router = useRouter(); const { toast } = useToast();
  return <Button variant="outline" size="sm" disabled={busy} onClick={async () => { setBusy(true); try { await api("/api/writing/feedback", { method: "POST", json: { submissionId } }); router.push(`/writing/submissions/${submissionId}`); router.refresh(); } catch (e) { toast((e as Error).message, "error"); setBusy(false); } }}><Sparkles />{busy ? "Evaluating…" : "Get full feedback"}</Button>;
}
