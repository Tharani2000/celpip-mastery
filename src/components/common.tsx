import { Headphones, BookOpen, PenLine, Mic, Layers, ClipboardCheck, Info } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
export const SKILL_ICON = { listening: Headphones, reading: BookOpen, writing: PenLine, speaking: Mic, vocabulary: Layers, mock: ClipboardCheck } as const;
export const SKILL_HEX: Record<string, string> = { listening: "#2F6BFF", reading: "#6B4EF0", writing: "#13B5C6", speaking: "#E0559B", vocabulary: "#E39B2D", mock: "#16245A" };
export function SkillIcon({ skill, className }: { skill: keyof typeof SKILL_ICON; className?: string }) {
  const I = SKILL_ICON[skill] ?? Layers; return <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", className)} style={{ background: `${SKILL_HEX[skill]}22`, color: SKILL_HEX[skill] }}><I className="size-5" aria-hidden="true" /></span>;
}
export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold md:text-4xl">{title}</h1>{description && <p className="mt-1.5 max-w-[62ch] text-muted-foreground">{description}</p>}</div>{children}</div>;
}
export const LevelBadge = ({ level }: { level: number | null | undefined }) => level ? <Badge variant="primary">≈ CELPIP {level}</Badge> : <Badge>Not measured</Badge>;
export const EstimateLabel = () => <Badge variant="warning"><Info />Unofficial practice estimate</Badge>;
export function EmptyState({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return <div className="flex flex-col items-center gap-3 px-4 py-10 text-center text-muted-foreground">{icon}<p className="font-bold text-foreground">{title}</p>{children}</div>;
}
