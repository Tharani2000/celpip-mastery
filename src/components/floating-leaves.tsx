/** Decorative maple leaves gently drifting down the background. Pure CSS, hidden from screen readers. */
const LEAVES = [
  { left: "6%", delay: "0s", dur: "14s", size: "1.4rem" }, { left: "18%", delay: "4s", dur: "18s", size: "1rem" },
  { left: "32%", delay: "9s", dur: "16s", size: "1.7rem" }, { left: "48%", delay: "2s", dur: "20s", size: "1.1rem" },
  { left: "63%", delay: "7s", dur: "15s", size: "1.5rem" }, { left: "77%", delay: "11s", dur: "19s", size: "1rem" },
  { left: "90%", delay: "5s", dur: "17s", size: "1.3rem" },
];
export function FloatingLeaves() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {LEAVES.map((l, i) => <span key={i} className="leaf-fall absolute -top-10" style={{ left: l.left, animationDelay: l.delay, animationDuration: l.dur, fontSize: l.size }}>🌺</span>)}
    </div>
  );
}
