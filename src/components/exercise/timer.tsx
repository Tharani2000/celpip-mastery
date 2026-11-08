"use client";
import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn, mmss } from "@/lib/utils";

/** Countdown that fires onExpire exactly once. Pass seconds=null for untimed. */
export function useCountdown(seconds: number | null, onExpire: () => void, running = true) {
  const end = useRef<number | null>(null); const fired = useRef(false); const cb = useRef(onExpire); cb.current = onExpire;
  const [left, setLeft] = useState(seconds ?? 0);
  useEffect(() => { if (seconds === null || !running) return; end.current = Date.now() + seconds * 1000; fired.current = false; setLeft(seconds);
    const id = setInterval(() => { const l = Math.max(0, (end.current! - Date.now()) / 1000); setLeft(l); if (l <= 0 && !fired.current) { fired.current = true; clearInterval(id); cb.current(); } }, 250);
    return () => clearInterval(id); }, [seconds, running]);
  return left;
}
export function TimerChip({ left, className }: { left: number; className?: string }) {
  return <span role="timer" className={cn("inline-flex items-center gap-2 rounded-xl bg-secondary px-3 py-1.5 font-display font-extrabold tabular-nums", left <= 30 && "bg-destructive/15 text-destructive", className)}><Clock className="size-4" aria-hidden="true" />{mmss(Math.ceil(left))}<span className="sr-only"> remaining</span></span>;
}
