import { Check, AlertTriangle, Target, Sparkles, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { Progress } from "@/components/ui/progress";
import { EstimateLabel } from "@/components/common";
import { LEVEL_DESC } from "@/lib/scoring";

const DIM: Record<string, string> = { content: "Content and task", coherence: "Coherence", vocabulary: "Vocabulary range", grammar: "Grammar", clarity: "Clarity", tone: "Tone", fluency: "Fluency", relevance: "Relevance", development: "Development" };
export function Dimensions({ scores }: { scores: Record<string, number> }) {
  return <div className="space-y-2.5">{Object.entries(scores).map(([k, v]) => <div key={k} className="grid grid-cols-[120px_1fr_28px] items-center gap-3 text-sm sm:grid-cols-[150px_1fr_32px]"><span className="text-muted-foreground">{DIM[k] ?? k}</span><Progress value={(v / 12) * 100} /><b className="text-right font-display">{v}</b></div>)}</div>;
}
export function Bullets({ items, tone }: { items: string[]; tone: "good" | "warn" | "plan" }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">Nothing to note here.</p>;
  const I = tone === "good" ? Check : tone === "warn" ? AlertTriangle : Target; const c = tone === "good" ? "text-success" : tone === "warn" ? "text-warning" : "text-purple";
  return <ul className="space-y-2">{items.map((t) => <li key={t} className="flex gap-2"><I className={`mt-0.5 size-4 shrink-0 ${c}`} /><span>{t}</span></li>)}</ul>;
}
export function Fixes({ items, a, b, why }: { items: Record<string, string>[]; a: string; b: string; why?: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No issues found in this area.</p>;
  return <div className="space-y-2">{items.map((x, i) => <div key={i} className="rounded-r-xl border-l-[3px] border-purple bg-secondary/60 px-3 py-2 text-sm"><del className="text-destructive">{x[a]}</del> <span className="text-muted-foreground">→</span> <ins className="font-bold text-success no-underline">{x[b]}</ins>{why && x[why] && <p className="mt-1 text-muted-foreground">{x[why]}</p>}</div>)}</div>;
}
export function EvalHeader({ level, mode, notice, xp, messages }: { level: number; mode: "AI" | "DEMO"; notice?: string; xp?: number; messages?: string[] }) {
  return (
    <Card className="p-6">
      {mode === "DEMO" && <Notice tone="warning" className="mb-4"><b>Demo evaluation.</b> {notice} Rule-based estimates are rougher than AI feedback.</Notice>}
      <div className="flex flex-wrap items-center gap-6">
        <div><div className="font-display text-6xl font-extrabold leading-none">{level}</div><p className="text-sm text-muted-foreground">estimated level</p></div>
        <div className="space-y-1.5"><b>{LEVEL_DESC[level]}</b><div className="flex flex-wrap gap-1.5"><EstimateLabel />{mode === "AI" ? <Badge variant="blue"><Sparkles />AI feedback</Badge> : <Badge>Rule-based demo</Badge>}</div><p className="max-w-[52ch] text-xs text-muted-foreground">Practice feedback only. This is not an official CELPIP score and doesn’t guarantee a test result.</p></div>
        <div className="ml-auto min-w-[200px] space-y-1.5">{!!xp && <Badge variant="success"><Zap />+{xp} XP</Badge>}{messages?.map((m) => <p key={m} className="text-sm text-muted-foreground">{m}</p>)}</div>
      </div>
    </Card>
  );
}
export const Section = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => <Card className={`space-y-3 p-5 ${className ?? ""}`}><h3 className="text-lg font-bold">{title}</h3>{children}</Card>;
export const Fold = ({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) => <details open={open} className="rounded-2xl border bg-card"><summary className="cursor-pointer p-4 font-bold">{title}</summary><div className="px-4 pb-4">{children}</div></details>;
export const SampleText = ({ text }: { text: string }) => <div className="whitespace-pre-wrap rounded-xl border bg-secondary/50 p-4 leading-relaxed">{text}</div>;
