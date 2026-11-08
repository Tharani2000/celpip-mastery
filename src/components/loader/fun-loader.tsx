"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { APP_EMOJI, LOADING_LINES } from "@/lib/brand";

/** Bouncing, wiggling maple leaf inside a spinning ring, with a rotating silly message. */
export function FunLoader({ compact = false }: { compact?: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(Math.floor(Math.random() * LOADING_LINES.length));
    const t = setInterval(() => setI((n) => (n + 1) % LOADING_LINES.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-center">
      <div className="relative grid size-20 place-items-center">
        <motion.span className="absolute inset-0 rounded-full brand-gradient" animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} />
        <motion.span className="absolute inset-2 rounded-full border-4 border-transparent border-r-cyan border-t-purple" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
        <motion.span className="text-4xl drop-shadow" animate={{ y: [0, -8, 0], rotate: [0, -15, 15, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} aria-hidden>{APP_EMOJI}</motion.span>
      </div>
      {!compact && (
        <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="min-h-[1.5rem] font-display text-base font-bold">
          {LOADING_LINES[i]}
        </motion.p>
      )}
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((d) => <motion.span key={d} className="size-2 rounded-full bg-purple" animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }} />)}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
