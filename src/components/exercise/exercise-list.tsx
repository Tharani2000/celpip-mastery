import Link from "next/link";
import { Badge } from "@/components/ui/badge";
export type ListItem = { id: string; href: string; number: number; eyebrow: string; title: string; blurb: string; meta: string[]; best: string | null; bestTone?: "success" | "blue" | "warning" };
export function ExerciseGrid({ items, color = "#2F6BFF", cols = 3 }: { items: ListItem[]; color?: string; cols?: 2 | 3 | 4 }) {
  return (
    <div className={cols === 2 ? "grid gap-4 md:grid-cols-2" : cols === 4 ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-4" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"}>
      {items.map((it) => (
        <Link key={it.id} href={it.href} className="group flex flex-col gap-2.5 rounded-[22px] border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple">
          <div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-xl font-display font-extrabold" style={{ background: `${color}22`, color }}>{it.number}</span>{it.best ? <Badge variant={it.bestTone ?? "blue"}>{it.best}</Badge> : <Badge>New</Badge>}</div>
          <div><p className="text-sm text-muted-foreground">{it.eyebrow}</p><h3 className="text-lg font-bold">{it.title}</h3></div>
          <p className="text-sm text-muted-foreground">{it.blurb}</p>
          <div className="mt-auto flex flex-wrap gap-x-3 text-xs text-muted-foreground">{it.meta.map((m) => <span key={m}>{m}</span>)}</div>
        </Link>))}
    </div>
  );
}
export const bestTone = (p: number) => (p >= 90 ? "success" : p >= 70 ? "blue" : "warning") as "success" | "blue" | "warning";
