"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toaster";
import { api } from "@/lib/client";
export function ProfileForm({ initial }: { initial: { displayName: string; targetScore: number; examDate: string | null; dailyMinutes: number } }) {
  const [v, setV] = useState(initial); const [busy, setBusy] = useState(false); const { toast } = useToast(); const router = useRouter();
  const save = async () => { setBusy(true); try { await api("/api/profile", { method: "PATCH", json: { displayName: v.displayName, targetScore: v.targetScore, examDate: v.examDate || null, dailyMinutes: v.dailyMinutes } }); toast("Profile saved."); router.refresh(); } catch (e) { toast((e as Error).message, "error"); } setBusy(false); };
  return <Card className="space-y-4 p-5"><h2 className="text-xl font-bold">Learning goals</h2>
    <div className="space-y-1.5"><Label htmlFor="dn">Name</Label><Input id="dn" value={v.displayName} maxLength={60} onChange={(e) => setV({ ...v, displayName: e.target.value })} /></div>
    <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="ts">Target CELPIP score</Label><Select id="ts" value={v.targetScore} onChange={(e) => setV({ ...v, targetScore: Number(e.target.value) })}>{[7, 8, 9, 10, 11, 12].map((n) => <option key={n} value={n}>{n}</option>)}</Select></div>
      <div className="space-y-1.5"><Label htmlFor="ed">Target exam date</Label><Input id="ed" type="date" value={v.examDate ?? ""} onChange={(e) => setV({ ...v, examDate: e.target.value || null })} /></div></div>
    <div className="space-y-1.5"><Label htmlFor="dm">Daily study time</Label><Select id="dm" value={v.dailyMinutes} onChange={(e) => setV({ ...v, dailyMinutes: Number(e.target.value) })}>{[15, 30, 45, 60, 90, 120].map((n) => <option key={n} value={n}>{n} minutes</option>)}</Select></div>
    <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save goals"}</Button></Card>;
}
