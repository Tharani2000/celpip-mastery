"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "system", label: "Match device", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon }
] as const;

/** Light / dark / match-device switch for the top of the app. `compact` is a single button that cycles through the three (for the phone header). */
export function ThemeToggle({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // next-themes only knows the theme on the client, so render a neutral state until mounted to avoid a hydration mismatch.
  const current = mounted ? theme ?? "system" : "system";
  const index = Math.max(0, OPTIONS.findIndex((o) => o.value === current));
  const choose = (value: string) => {
    setTheme(value);
    // Remember the choice on the account too, quietly: no loader, and a failure just means it is only remembered on this device.
    api("/api/profile", { method: "PATCH", json: { theme: value }, silent: true }).catch(() => {});
  };

  if (compact) {
    const Icon = OPTIONS[index].icon; const next = OPTIONS[(index + 1) % OPTIONS.length];
    return (
      <button type="button" onClick={() => choose(next.value)} aria-label={`Theme: ${OPTIONS[index].label}. Switch to ${next.label}`} title={`Theme: ${OPTIONS[index].label}`}
        className={cn("grid size-7 place-items-center rounded-full bg-secondary text-foreground transition-transform active:scale-90", className)}><Icon className="size-3.5" /></button>
    );
  }
  return (
    <div role="radiogroup" aria-label="Theme" className={cn("inline-flex items-center gap-0.5 rounded-full border bg-card/80 p-0.5 shadow-sm backdrop-blur", className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const on = current === value;
        return (
          <button key={value} type="button" role="radio" aria-checked={on} aria-label={label} title={label} onClick={() => choose(value)}
            className={cn("relative grid size-8 place-items-center rounded-full transition-colors", on ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground")}>
            {on && <motion.span layoutId="theme-pill" className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
            <Icon className="relative size-4" />
          </button>
        );
      })}
    </div>
  );
}
