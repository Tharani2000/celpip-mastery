"use client";
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SKILLS, SKILL_NAME } from "@/lib/content-types";

const COLORS: Record<string, string> = { listening: "#2F6BFF", reading: "#6B4EF0", writing: "#13B5C6", speaking: "#E0559B" };
type Point = { t: number; skill: string; level: number; label: string };
const tip = { contentStyle: { borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" } };

export function LevelTrend({ timeline }: { timeline: Point[] }) {
  const [sel, setSel] = useState("all");
  const data = useMemo(() => timeline.filter((p) => sel === "all" || p.skill === sel).map((p, i) => ({ i: i + 1, date: new Date(p.t).toLocaleDateString("en-CA", { month: "short", day: "numeric" }), [p.skill]: p.level, label: p.label })), [timeline, sel]);
  return (
    <Card className="space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Estimated level over time</h2>
        <Tabs value={sel} onValueChange={setSel}><TabsList><TabsTrigger value="all">All</TabsTrigger>{SKILLS.map((s) => <TabsTrigger key={s} value={s}>{SKILL_NAME[s]}</TabsTrigger>)}</TabsList></Tabs></div>
      {data.length ? <div className="h-64"><ResponsiveContainer><LineChart data={data} margin={{ left: -18, right: 8, top: 8 }}><CartesianGrid stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} /><YAxis domain={[1, 12]} ticks={[2, 4, 6, 8, 10, 12]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} /><Tooltip {...tip} /><Legend />
        {SKILLS.filter((s) => sel === "all" || sel === s).map((s) => <Line key={s} type="monotone" dataKey={s} name={SKILL_NAME[s]} stroke={COLORS[s]} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />)}</LineChart></ResponsiveContainer></div>
        : <p className="py-10 text-center text-muted-foreground">Complete a few exercises and your trend will appear here.</p>}
      <p className="text-xs text-muted-foreground">Each point is one attempt. Listening and reading scores convert to an approximate level.</p>
    </Card>
  );
}
export function HBar({ title, note, data, unit = "%", max = 100 }: { title: string; note?: string; data: { name: string; value: number; color?: string }[]; unit?: string; max?: number }) {
  return (
    <Card className="space-y-2 p-5"><h3 className="text-lg font-bold">{title}</h3>{note && <p className="text-xs text-muted-foreground">{note}</p>}
      {data.length ? <div style={{ height: Math.max(120, data.length * 36) }}><ResponsiveContainer><BarChart data={data} layout="vertical" margin={{ left: 10, right: 16 }}><XAxis type="number" domain={[0, max]} hide /><YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} /><Tooltip {...tip} formatter={(v: number) => `${v}${unit}`} /><Bar dataKey="value" radius={[0, 8, 8, 0]}>{data.map((d, i) => <Cell key={i} fill={d.color ?? "#6B4EF0"} />)}</Bar></BarChart></ResponsiveContainer></div>
        : <p className="py-8 text-center text-muted-foreground">No data yet.</p>}</Card>
  );
}
export function MinutesChart({ data }: { data: { day: string; minutes: number }[] }) {
  return <Card className="space-y-2 p-5"><h3 className="text-lg font-bold">Practice minutes, last 14 days</h3><div className="h-44"><ResponsiveContainer><BarChart data={data} margin={{ left: -24 }}><XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} /><Tooltip {...tip} formatter={(v: number) => `${v} min`} /><Bar dataKey="minutes" fill="#6B4EF0" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>;
}
