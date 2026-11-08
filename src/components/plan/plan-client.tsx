"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, CalendarCheck, CheckCircle2, Circle, Coffee, Play, Plus, RefreshCw, Settings2, Sparkles, StickyNote, X } from "lucide-react";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";
import { DEFAULT_SETTINGS, PLAN_SKILLS, SKILL_MINUTES, VOCAB_MINUTES, MOCK_MINUTES, isItemDone, planProgress, skillWord, type CatalogExercise, type PlanDay, type PlanItem, type PlanKind, type PlanLevel, type PlanSettings, type PlanSkill } from "@/lib/plan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { SkillIcon, SKILL_HEX } from "@/components/common";
import { useToast } from "@/components/toaster";

type View = { plan: { settings: PlanSettings; days: PlanDay[]; startedAt: string } | null; catalog: CatalogExercise[]; completed: string[] };
const uid = () => Math.random().toString(36).slice(2, 10);
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (s: string) => { const d = new Date(`${s}T00:00:00Z`); return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`; };
const kindIcon = (k: PlanKind) => (k === "vocab" ? "vocabulary" : k === "custom" ? null : k) as "listening" | "reading" | "writing" | "speaking" | "vocabulary" | "mock" | null;
const hrefFor = (i: PlanItem) => (i.exerciseId ? `/${i.kind}/${i.exerciseId}` : i.kind === "vocab" ? "/vocabulary" : i.kind === "mock" ? "/mock" : null);
const DIFF_LABEL = { INTERMEDIATE: "Intermediate", ADVANCED: "Advanced", EXPERT: "Expert" } as const;
const LEVELS: { value: PlanLevel; label: string }[] = [{ value: "gentle", label: "Start gentle, build up (recommended)" }, { value: "mixed", label: "Mixed difficulty" }, { value: "challenge", label: "Challenge me: hardest first" }];
const fieldLabel = "mb-1.5 block text-sm font-bold";

export function PlanClient({ initial, today }: { initial: View; today: string }) {
  const { toast } = useToast();
  const [days, setDays] = useState<PlanDay[] | null>(initial.plan?.days ?? null);
  const [settings, setSettings] = useState<PlanSettings>(initial.plan?.settings ?? { ...DEFAULT_SETTINGS, startDate: today });
  const [completed, setCompleted] = useState(() => new Set(initial.completed));
  const [showSettings, setShowSettings] = useState(!initial.plan);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const skipSave = useRef(true);
  const todayRef = useRef<HTMLDivElement | null>(null);
  const catalog = initial.catalog;
  const byId = useMemo(() => new Map(catalog.map((e) => [e.id, e])), [catalog]);

  // Save hand edits a moment after the last change, without showing the full-screen loader.
  useEffect(() => {
    if (!days) return;
    if (skipSave.current) { skipSave.current = false; return; }
    setSave("saving");
    const t = setTimeout(() => { api("/api/plan", { method: "PUT", json: { days }, silent: true }).then(() => setSave("saved")).catch((e) => { setSave("error"); toast((e as Error).message, "error"); }); }, 700);
    return () => clearTimeout(t);
  }, [days, toast]);

  const edit = useCallback((fn: (d: PlanDay[]) => PlanDay[]) => setDays((d) => (d ? fn(d) : d)), []);
  const patchDay = (day: number, fn: (d: PlanDay) => PlanDay) => edit((ds) => ds.map((d) => (d.day === day ? fn(d) : d)));
  const patchItem = (day: number, id: string, fn: (i: PlanItem) => PlanItem) => patchDay(day, (d) => ({ ...d, items: d.items.map((i) => (i.id === id ? fn(i) : i)) }));

  async function generate() {
    setBusy(true);
    try {
      const r = await api<View>("/api/plan", { method: "POST", json: settings });
      skipSave.current = true; setDays(r.plan?.days ?? null); setCompleted(new Set(r.completed)); setShowSettings(false); setSave("idle");
      toast("Your plan is ready.");
    } catch (e) { toast((e as Error).message, "error"); }
    setBusy(false);
  }

  const usedIds = useMemo(() => new Set((days ?? []).flatMap((d) => d.items.map((i) => i.exerciseId).filter(Boolean) as string[])), [days]);
  const addItem = (day: number, kind: PlanKind, text?: string) => {
    let item: PlanItem;
    if (kind === "vocab") item = { id: uid(), kind, label: "Review your vocabulary cards", minutes: VOCAB_MINUTES };
    else if (kind === "mock") item = { id: uid(), kind, label: "Full mock test (all four skills)", minutes: MOCK_MINUTES };
    else if (kind === "custom") item = { id: uid(), kind, label: (text ?? "").trim(), minutes: 15 };
    else {
      const list = catalog.filter((e) => e.skill === kind);
      const pick = list.find((e) => !usedIds.has(e.id) && !completed.has(e.id)) ?? list.find((e) => !usedIds.has(e.id)) ?? list[0];
      if (!pick) return;
      item = { id: uid(), kind, label: pick.label, minutes: SKILL_MINUTES[kind as PlanSkill], exerciseId: pick.id };
    }
    if (!item.label) return;
    patchDay(day, (d) => ({ ...d, rest: false, items: [...d.items, item] }));
  };

  const progress = useMemo(() => planProgress(days ?? [], completed), [days, completed]);
  const todayDay = days?.find((d) => d.date === today);
  const dayNo = todayDay ? todayDay.day : days && today < days[0].date ? 0 : days ? days.length : 0;
  const weeks = useMemo(() => { const w: PlanDay[][] = []; (days ?? []).forEach((d, i) => { if (i % 7 === 0) w.push([]); w[w.length - 1].push(d); }); return w; }, [days]);

  const setSkill = (k: PlanSkill) => setSettings((s) => ({ ...s, skills: { ...s.skills, [k]: !s.skills[k] } }));
  const settingsCard = (
    <Card className="space-y-5 p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div><label htmlFor="pl-start" className={fieldLabel}>Start date</label><Input id="pl-start" type="date" value={settings.startDate} onChange={(e) => e.target.value && setSettings({ ...settings, startDate: e.target.value })} /></div>
        <div><label htmlFor="pl-len" className={fieldLabel}>Plan length</label>
          <Select id="pl-len" value={settings.days} onChange={(e) => setSettings({ ...settings, days: Number(e.target.value) })}>{[14, 21, 30, 45, 60].map((n) => <option key={n} value={n}>{n} days</option>)}</Select></div>
        <div><label htmlFor="pl-min" className={fieldLabel}>Study time per day: <span className="font-display text-purple">{settings.dailyMinutes} min</span></label>
          <input id="pl-min" type="range" min={20} max={180} step={5} value={settings.dailyMinutes} onChange={(e) => setSettings({ ...settings, dailyMinutes: Number(e.target.value) })} className="h-10 w-full accent-[hsl(var(--purple))]" /></div>
        <div><label htmlFor="pl-rest" className={fieldLabel}>Rest days</label>
          <Select id="pl-rest" value={settings.restDays} onChange={(e) => setSettings({ ...settings, restDays: Number(e.target.value) })}>{[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n === 0 ? "None, study every day" : `${n} per week`}</option>)}</Select></div>
        <div><label htmlFor="pl-mock" className={fieldLabel}>Full mock test</label>
          <Select id="pl-mock" value={settings.mockEvery} onChange={(e) => setSettings({ ...settings, mockEvery: Number(e.target.value) })}>
            <option value={0}>No mock tests</option>{[4, 5, 6, 7].map((n) => <option key={n} value={n}>Every {n} study days</option>)}</Select></div>
        <div><label htmlFor="pl-level" className={fieldLabel}>Difficulty</label>
          <Select id="pl-level" value={settings.level} onChange={(e) => setSettings({ ...settings, level: e.target.value as PlanLevel })}>{LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</Select></div>
      </div>
      <fieldset><legend className={fieldLabel}>What should the plan include?</legend>
        <div className="flex flex-wrap gap-2">
          {PLAN_SKILLS.map((k) => <Chip key={k} on={settings.skills[k]} color={SKILL_HEX[k]} onClick={() => setSkill(k)}>{skillWord(k)}</Chip>)}
          <Chip on={settings.vocab} color={SKILL_HEX.vocabulary} onClick={() => setSettings({ ...settings, vocab: !settings.vocab })}>Daily vocabulary</Chip>
        </div></fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" disabled={busy} onClick={() => (days ? setConfirm(true) : void generate())}>{days ? <RefreshCw /> : <Sparkles />}{busy ? "Building…" : days ? "Rebuild my plan" : "Create my plan"}</Button>
        {days && <span className="text-sm text-muted-foreground">Rebuilding replaces your current plan, including your edits and ticks.</span>}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {days && (
        <Card className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-bold">{dayNo > 0 && dayNo <= days.length ? `You’re on day ${dayNo} of ${days.length}` : dayNo === 0 ? `Your plan starts on ${fmtDate(days[0].date)}` : "Your plan is complete. Well done!"}</h2>
              <p className="text-sm text-muted-foreground">{progress.done} of {progress.total} activities done · {progress.percent}%</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("text-xs font-bold", save === "error" ? "text-destructive" : "text-muted-foreground")} aria-live="polite">{save === "saving" ? "Saving…" : save === "saved" ? "All changes saved" : save === "error" ? "Couldn’t save. Edit again to retry." : ""}</span>
              {todayDay && <Button variant="outline" size="sm" onClick={() => todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}><CalendarCheck />Jump to today</Button>}
              <Button variant="outline" size="sm" onClick={() => setShowSettings((v) => !v)} aria-expanded={showSettings}><Settings2 />{showSettings ? "Hide settings" : "Plan settings"}</Button>
            </div>
          </div>
          <Progress value={progress.percent} className="h-2" />
        </Card>
      )}
      {showSettings && <section aria-label="Plan settings">{!days && <Notice tone="info" className="mb-4">Tell us how you like to study and we’ll build a day-by-day plan from the full practice bank. New material comes first, easier before harder. You can edit every day afterwards.</Notice>}{settingsCard}</section>}

      {weeks.map((week, wi) => (
        <section key={wi} aria-label={`Week ${wi + 1}`}>
          <h2 className="mb-3 text-lg font-bold text-muted-foreground">Week {wi + 1}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {week.map((d) => (
              <DayCard key={d.day} day={d} isToday={d.date === today} past={d.date < today} budget={settings.dailyMinutes} completed={completed} catalog={catalog} byId={byId}
                innerRef={d.date === today ? todayRef : undefined}
                onToggleRest={() => patchDay(d.day, (x) => ({ ...x, rest: !x.rest, items: x.rest ? x.items : [] }))}
                onAdd={(kind, text) => addItem(d.day, kind, text)}
                onRemove={(id) => patchDay(d.day, (x) => ({ ...x, items: x.items.filter((i) => i.id !== id) }))}
                onTick={(id) => patchItem(d.day, id, (i) => ({ ...i, done: !i.done }))}
                onSwap={(id, exId) => { const e = byId.get(exId); if (e) patchItem(d.day, id, (i) => ({ ...i, exerciseId: e.id, label: e.label })); }}
                onRename={(id, label) => patchItem(d.day, id, (i) => ({ ...i, label }))}
                onMinutes={(id, m) => patchItem(d.day, id, (i) => ({ ...i, minutes: m }))} />
            ))}
          </div>
        </section>
      ))}
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} destructive title="Rebuild your plan?" description="This creates a brand-new plan from the settings above. Your current edits, swaps and ticks will be replaced. Your practice history is not affected." confirmLabel="Rebuild plan" onConfirm={() => void generate()} />
    </div>
  );
}

function Chip({ on, color, onClick, children }: { on: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={on} onClick={onClick} className={cn("flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all active:scale-95", on ? "text-white shadow-md" : "bg-card text-muted-foreground hover:bg-secondary")} style={on ? { background: color, borderColor: color } : undefined}>{on ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}{children}</button>;
}

type DayProps = {
  day: PlanDay; isToday: boolean; past: boolean; budget: number; completed: ReadonlySet<string>; catalog: CatalogExercise[]; byId: Map<string, CatalogExercise>;
  innerRef?: React.Ref<HTMLDivElement>;
  onToggleRest: () => void; onAdd: (k: PlanKind, text?: string) => void; onRemove: (id: string) => void; onTick: (id: string) => void;
  onSwap: (id: string, exerciseId: string) => void; onRename: (id: string, label: string) => void; onMinutes: (id: string, m: number) => void;
};
function DayCard({ day, isToday, past, budget, completed, catalog, byId, innerRef, onToggleRest, onAdd, onRemove, onTick, onSwap, onRename, onMinutes }: DayProps) {
  const [adding, setAdding] = useState(""); const [note, setNote] = useState(""); const [swapId, setSwapId] = useState<string | null>(null);
  const total = day.items.reduce((m, i) => m + i.minutes, 0);
  const hasMock = day.items.some((i) => i.kind === "mock");
  const over = !hasMock && total > budget;
  const allDone = day.items.length > 0 && day.items.every((i) => isItemDone(i, completed));
  return (
    <div ref={innerRef} className="scroll-mt-24">
      <Card className={cn("flex h-full flex-col gap-3 p-4", isToday && "ring-2 ring-purple", day.rest && "bg-secondary/40", past && !isToday && !allDone && "opacity-90")}>
        <div className="flex items-start justify-between gap-2">
          <div><h3 className="font-display text-lg font-bold leading-tight">Day {day.day}</h3><p className="text-sm text-muted-foreground">{fmtDate(day.date)}</p></div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {isToday && <Badge variant="primary">Today</Badge>}
            {allDone && <Badge variant="success"><CheckCircle2 />Done</Badge>}
            {day.rest ? <Badge><Coffee />Rest day</Badge> : <Badge variant={over ? "warning" : "default"} title={over ? `More than your ${budget}-minute goal` : undefined}>{total} min</Badge>}
          </div>
        </div>

        {day.rest && <p className="flex-1 text-sm text-muted-foreground">Recharge today. Sleep and rest help new vocabulary stick. You can still add something if you feel like it.</p>}
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {day.items.map((i) => {
              const ic = kindIcon(i.kind); const href = hrefFor(i); const ex = i.exerciseId ? byId.get(i.exerciseId) : undefined;
              const auto = !!i.exerciseId && completed.has(i.exerciseId); const done = isItemDone(i, completed);
              return (
                <motion.li key={i.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.2 }} className={cn("rounded-xl border bg-card p-2.5", done && "bg-success/5")}>
                  <div className="flex items-start gap-2.5">
                    <button type="button" disabled={auto} onClick={() => onTick(i.id)} aria-label={done ? `Mark ${i.label} not done` : `Mark ${i.label} done`} title={auto ? "Completed by practising" : undefined} className="mt-0.5 shrink-0 text-muted-foreground disabled:cursor-default">
                      {done ? <CheckCircle2 className="size-6 text-success" /> : <Circle className="size-6 transition-colors hover:text-purple" />}</button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {ic ? <SkillIcon skill={ic} className="size-7 rounded-lg [&>svg]:size-4" /> : <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground"><StickyNote className="size-4" /></span>}
                        {i.kind === "custom" ? <input value={i.label} onChange={(e) => onRename(i.id, e.target.value.slice(0, 140))} aria-label="Activity name" className="min-w-0 flex-1 rounded-md bg-transparent px-1 text-sm font-bold focus-visible:bg-secondary" />
                          : <span className={cn("text-sm font-bold leading-snug", done && "text-muted-foreground line-through decoration-1")}>{i.label}</span>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-9">
                        {ex && <Badge variant={ex.difficulty === "INTERMEDIATE" ? "success" : "primary"}>{DIFF_LABEL[ex.difficulty]}</Badge>}
                        <label className="flex items-center gap-1 text-xs text-muted-foreground"><span className="sr-only">Minutes</span>
                          <input type="number" min={0} max={300} value={i.minutes} onChange={(e) => onMinutes(i.id, Math.max(0, Math.min(300, Math.round(Number(e.target.value) || 0))))} className="h-6 w-12 rounded-md border bg-transparent px-1 text-center text-xs" />min</label>
                        {href && <Button asChild size="sm" variant={done ? "outline" : "default"} className="h-7 px-2.5"><Link href={href}><Play />{done ? "Again" : "Start"}</Link></Button>}
                        {ex && <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={() => setSwapId(swapId === i.id ? null : i.id)} aria-expanded={swapId === i.id}><ArrowLeftRight />Swap</Button>}
                        <Button type="button" size="sm" variant="ghost" className="ml-auto h-7 px-1.5 text-muted-foreground hover:text-destructive" onClick={() => onRemove(i.id)} aria-label={`Remove ${i.label}`}><X /></Button>
                      </div>
                      {ex && swapId === i.id && (
                        <Select aria-label="Choose a different exercise" className="mt-2 h-9 text-xs" value={i.exerciseId} onChange={(e) => { onSwap(i.id, e.target.value); setSwapId(null); }}>
                          {catalog.filter((c) => c.skill === ex.skill).sort((a, b) => a.group - b.group || a.slug.localeCompare(b.slug, undefined, { numeric: true })).map((c) => <option key={c.id} value={c.id}>{c.label} ({DIFF_LABEL[c.difficulty]}){completed.has(c.id) ? " ✓" : ""}</option>)}
                        </Select>)}
                    </div>
                  </div>
                </motion.li>);
            })}
          </AnimatePresence>
        </ul>

        <div className="mt-auto space-y-2 pt-1">
          {adding === "custom" ? (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) { onAdd("custom", note); setNote(""); setAdding(""); } }}>
              <Input autoFocus value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} placeholder="e.g. Read a Canadian news article" aria-label="Your own activity" className="h-9" />
              <Button type="submit" size="sm" disabled={!note.trim()}>Add</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setAdding(""); setNote(""); }} aria-label="Cancel"><X /></Button>
            </form>
          ) : (
            <Select aria-label={`Add an activity to day ${day.day}`} className="h-9 text-xs" value="" onChange={(e) => { const v = e.target.value; if (v === "custom") setAdding("custom"); else if (v) onAdd(v as PlanKind); }}>
              <option value="">+ Add an activity…</option>
              {PLAN_SKILLS.map((k) => <option key={k} value={k}>{skillWord(k)} exercise</option>)}
              <option value="vocab">Vocabulary review</option><option value="mock">Full mock test</option><option value="custom">My own activity…</option>
            </Select>
          )}
          <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onToggleRest}>{day.rest ? <><Plus />Make this a study day</> : <><Coffee />{day.items.length ? "Make this a rest day (clears activities)" : "Make this a rest day"}</>}</Button>
        </div>
      </Card>
    </div>
  );
}
