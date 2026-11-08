"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { loaderStore } from "./loader-store";
import { FunLoader } from "./fun-loader";

const SHOW_DELAY = 150; // ms before appearing, so instant calls don't flash
const MIN_VISIBLE = 450; // ms once shown, so it doesn't blink away

/** Full-screen loader shown whenever any /api/* request is in flight. */
export function GlobalLoader() {
  const pending = useSyncExternalStore(loaderStore.subscribe, loaderStore.get, loaderStore.getServer);
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (pending > 0 && !visible) t = setTimeout(() => { shownAt.current = Date.now(); setVisible(true); }, SHOW_DELAY);
    else if (pending === 0 && visible) t = setTimeout(() => setVisible(false), Math.max(0, MIN_VISIBLE - (Date.now() - shownAt.current)));
    return () => clearTimeout(t);
  }, [pending, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div key="global-loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-background/55 backdrop-blur-[3px]" aria-busy="true">
          <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-purple/15"><div className="loader-bar h-full w-1/3 brand-gradient" /></div>
          <motion.div initial={{ scale: 0.8, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="mx-4 rounded-3xl border bg-card/95 px-8 py-7 shadow-2xl">
            <FunLoader />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
