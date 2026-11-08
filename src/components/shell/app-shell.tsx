"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import { Flame, LogOut, MoreHorizontal, Zap, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV } from "./nav-items";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type Header = { level: number; into: number; need: number; xp: number; streak: number; theme: string };
const Brand = () => <Link href="/dashboard" aria-label="Home"><BrandLogo /></Link>;

export function AppShell({ header, children }: { header: Header; children: React.ReactNode }) {
  const path = usePathname(); const [sheet, setSheet] = useState(false);
  // The saved account theme is applied everywhere in the app, not only on the Settings page.
  // Only when the saved value itself changes: re-running on every toggle would put the old saved theme back over the user's new choice.
  const { setTheme } = useTheme(); const setThemeRef = useRef(setTheme); setThemeRef.current = setTheme;
  useEffect(() => { setThemeRef.current(header.theme); }, [header.theme]);
  const exam = /^\/mock\/[^/]+\/run/.test(path);
  const active = (href: string) => path === href || path.startsWith(href + "/");
  if (exam) return <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4">{children}</main>;
  return (
    <div className="grid min-h-screen md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-1 overflow-y-auto border-r bg-card/70 px-3.5 py-4 backdrop-blur md:flex" aria-label="Main navigation">
        <div className="px-2.5 pb-3"><Brand /></div>
        <nav className="flex flex-col gap-0.5">{NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[.95rem] font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground", active(href) && "text-accent-foreground hover:bg-transparent hover:text-accent-foreground")}>{active(href) && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-accent" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}<Icon className="relative size-5 transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110" /><span className="relative">{label}</span></Link>))}
        </nav>
        <div className="mt-auto shrink-0 rounded-2xl border bg-secondary/60 p-3">
          <div className="flex items-center justify-between"><b className="font-display">Level {header.level}</b><span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground"><Flame className="size-3.5 animate-flicker" />{header.streak} day{header.streak === 1 ? "" : "s"}</span></div>
          <Progress value={(header.into / header.need) * 100} className="mt-2 h-1.5" />
          <p className="mt-1.5 text-xs text-muted-foreground">{header.into} / {header.need} XP to level {header.level + 1}</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="group mt-2 flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-[.95rem] font-bold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><LogOut className="size-5 transition-transform group-hover:translate-x-0.5" />Sign out</button>
      </aside>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-card/90 px-4 pb-3 pt-[calc(.75rem+env(safe-area-inset-top))] backdrop-blur md:hidden">
        <Brand /><div className="flex gap-2"><span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground"><Flame className="size-3.5 animate-flicker" />{header.streak}</span><span className="flex items-center gap-1 rounded-full bg-blue/15 px-2 py-0.5 text-xs font-bold text-blue"><Zap className="size-3.5" />{header.xp}</span><ThemeToggle compact /><button onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Sign out" className="grid size-7 place-items-center rounded-full bg-destructive/10 text-destructive active:scale-90"><LogOut className="size-3.5" /></button></div>
      </header>
      <main id="main" className="mx-auto w-full min-w-0 max-w-[1240px] px-4 pb-28 pt-6 md:px-10 md:pb-16 md:pt-5"><div className="mb-3 hidden justify-end md:flex"><ThemeToggle /></div>{children}</main>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t bg-card px-1.5 pb-[calc(.4rem+env(safe-area-inset-bottom))] pt-1.5 md:hidden">
        {NAV.filter((n) => ["/dashboard", "/plan", "/speaking", "/mock"].includes(n.href)).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[.7rem] font-bold text-muted-foreground transition-transform active:scale-90", active(href) && "text-purple")}><Icon className={cn("size-[22px] transition-transform", active(href) && "-translate-y-0.5 scale-110")} />{label.replace(" Tests", "")}</Link>))}
        <button onClick={() => setSheet(true)} className="flex flex-col items-center gap-0.5 py-1.5 text-[.7rem] font-bold text-muted-foreground"><MoreHorizontal className="size-[22px]" />More</button>
      </nav>
      <AnimatePresence>{sheet && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-end bg-navy/40 md:hidden" onClick={() => setSheet(false)}>
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 34 }} className="grid w-full grid-cols-2 gap-1 rounded-t-3xl bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSheet(false)} className="col-span-2 mb-1 ml-auto flex items-center gap-1 text-sm text-muted-foreground"><X className="size-4" />Close</button>
            {NAV.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setSheet(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-bold hover:bg-secondary"><Icon className="size-5" />{label}</Link>)}
          </motion.div>
        </motion.div>)}</AnimatePresence>
    </div>
  );
}
