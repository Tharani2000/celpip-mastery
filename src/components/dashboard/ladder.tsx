"use client";
import { motion } from "framer-motion";
import { SKILLS, SKILL_NAME } from "@/lib/content-types";
/** Each skill's estimated level as a climb up the 1–12 scale, with the target rung marked. */
export function LevelLadder({ levels, target }: { levels: Record<string, number>; target: number }) {
  const rung = 20;
  return (
    <div className="relative z-[1] rounded-[20px] border border-white/10 bg-[#080e28]/35 p-4" aria-label="Estimated CELPIP level per skill on a 1 to 12 scale">
      <div className="grid grid-cols-[28px_repeat(4,1fr)] gap-x-2" style={{ gridTemplateRows: `repeat(12, ${rung}px)` }}>
        {Array.from({ length: 12 }, (_, i) => 12 - i).map((n, i) => <div key={n} style={{ gridColumn: 1, gridRow: i + 1 }} className={`text-right font-display text-xs leading-5 ${n === target ? "font-extrabold text-[#7FF0FA]" : "text-[#9FA9DA]"}`}>{n}</div>)}
        {SKILLS.map((s, i) => { const l = levels[s] ?? 0; return (
          <div key={s} className="relative rounded-lg" style={{ gridColumn: i + 2, gridRow: "1 / span 12", background: `repeating-linear-gradient(to bottom, rgba(255,255,255,.07) 0 1px, transparent 1px ${rung}px)` }}>
            <div className="absolute inset-x-0 h-5 rounded-lg border-[1.5px] border-dashed border-[#7FF0FA]/70" style={{ top: (12 - target) * rung }} />
            <motion.div className="absolute inset-x-[22%] bottom-0 rounded-t-lg rounded-b" style={{ background: "linear-gradient(to top, rgba(107,78,240,.9), rgba(19,181,198,.95))" }} initial={{ height: 0 }} animate={{ height: l * rung }} transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }} />
            {l > 0 && <motion.span className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full bg-white px-2 font-display text-xs font-extrabold text-[#16245A]" initial={{ bottom: 0 }} animate={{ bottom: l * rung }} transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}>{l}</motion.span>}
          </div>); })}
      </div>
      <div className="mt-2 grid grid-cols-[28px_repeat(4,1fr)] gap-2 text-center text-xs font-bold text-[#C9D2FF]"><span />{SKILLS.map((s) => <span key={s}>{SKILL_NAME[s]}</span>)}</div>
      <p className="mt-2 text-xs text-[#9FA9DA]">Dashed line marks your target. Levels are unofficial practice estimates.</p>
    </div>
  );
}
