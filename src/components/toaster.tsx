"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap, CheckCircle2, AlertTriangle } from "lucide-react";

type Toast = { id: number; text: string; xp?: number; tone?: "ok" | "error" };
type XpEvent = { xp: number; reason: string };
const Ctx = createContext<{ toast: (text: string, tone?: "ok" | "error") => void; showXp: (events?: XpEvent[]) => void }>({ toast: () => {}, showXp: () => {} });
export const useToast = () => useContext(Ctx);

export function Toaster({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => { const id = Date.now() + Math.random(); setItems((s) => [...s, { ...t, id }]); setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 4200); }, []);
  const toast = useCallback((text: string, tone: "ok" | "error" = "ok") => push({ text, tone }), [push]);
  const showXp = useCallback((events?: XpEvent[]) => (events ?? []).filter((e) => e.xp > 0).forEach((e, i) => setTimeout(() => push({ text: e.reason, xp: e.xp }), i * 350)), [push]);
  return (
    <Ctx.Provider value={{ toast, showXp }}>
      {children}
      <div aria-live="polite" className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[90] flex flex-col gap-2 md:bottom-4 md:left-auto md:w-80">
        <AnimatePresence>{items.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 24, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 60, scale: 0.9 }} transition={{ type: "spring", stiffness: 420, damping: 26 }} className="flex items-center gap-2.5 rounded-2xl border bg-card px-4 py-3 text-sm font-bold shadow-xl">
            {t.xp ? <span className="flex items-center gap-1 font-display text-purple"><Zap className="size-4 animate-wiggle" />+{t.xp} XP</span> : t.tone === "error" ? <AlertTriangle className="size-4 text-destructive" /> : <CheckCircle2 className="size-4 text-success" />}
            <span>{t.text}</span>
          </motion.div>))}</AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
