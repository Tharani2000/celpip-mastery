"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Target, Shuffle, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toaster";
import { api } from "@/lib/client";

type Opt = { id: string; label: string; group: "Listening parts" | "Reading parts" | "Writing tasks" | "Speaking tasks" };
const SECTIONS = [["LISTENING", "Listening", "6 parts"], ["READING", "Reading", "4 parts"], ["WRITING", "Writing", "2 tasks"], ["SPEAKING", "Speaking", "8 tasks"]] as const;

export function MockLauncher({ options, summary }: { options: Opt[]; summary: string[] }) {
  const router = useRouter(); const { toast } = useToast(); const [busy, setBusy] = useState(false); const [sel, setSel] = useState<Set<string>>(new Set()); const [untimed, setUntimed] = useState(false);
  const start = async (payload: object) => { setBusy(true); try { const r = await api<{ attemptId: string }>("/api/mock", { method: "POST", json: payload }); router.push(`/mock/${r.attemptId}/run`); } catch (e) { toast((e as Error).message, "error"); setBusy(false); } };
  const groups = ["Listening parts", "Reading parts", "Writing tasks", "Speaking tasks"] as const;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="flex flex-col gap-3 p-5"><span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground"><ClipboardCheck className="size-5" /></span><h2 className="text-xl font-bold">Full mock test</h2><p className="text-sm text-muted-foreground">All four sections in test order: Listening, Reading, Writing, Speaking. Plan for about two hours.</p>
        <ul className="space-y-1.5 text-sm">{summary.map((s) => <li key={s} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />{s}</li>)}</ul>
        <Button className="mt-auto" disabled={busy} onClick={() => start({ kind: "FULL" })} data-testid="start-full">Start full mock</Button></Card>
      <Card className="flex flex-col gap-3 p-5"><span className="grid size-10 place-items-center rounded-xl bg-blue/15 text-blue"><Target className="size-5" /></span><h2 className="text-xl font-bold">Section-wise mock</h2><p className="text-sm text-muted-foreground">One complete section under exam conditions.</p>
        <div className="mt-auto flex flex-col gap-2">{SECTIONS.map(([k, n, d]) => <Button key={k} variant="outline" className="justify-between" disabled={busy} onClick={() => start({ kind: "SECTION", skill: k })} data-testid={`section-${k}`}><span>{n}</span><span className="text-xs text-muted-foreground">{d}</span></Button>)}</div></Card>
      <Card className="flex flex-col gap-3 p-5"><span className="grid size-10 place-items-center rounded-xl bg-cyan/15 text-cyan"><Shuffle className="size-5" /></span><h2 className="text-xl font-bold">Custom practice test</h2><p className="text-sm text-muted-foreground">Pick any parts and tasks. Feedback still waits until the end.</p>
        {groups.map((g) => <details key={g} className="rounded-xl border"><summary className="cursor-pointer p-3 text-sm font-bold">{g}</summary><div className="space-y-1.5 px-3 pb-3">{options.filter((o) => o.group === g).map((o) => <label key={o.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sel.has(o.id)} onChange={(e) => setSel((s) => { const n = new Set(s); if (e.target.checked) n.add(o.id); else n.delete(o.id); return n; })} />{o.label}</label>)}</div></details>)}
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={untimed} onChange={(e) => setUntimed(e.target.checked)} />Turn off listening, reading and writing timers</label>
        <Button disabled={busy || !sel.size} onClick={() => start({ kind: "CUSTOM", exerciseIds: [...sel], untimed })}>Start custom test ({sel.size} selected)</Button></Card>
    </div>
  );
}
