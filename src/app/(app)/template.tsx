"use client";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
/** Gentle page transition; skipped inside mock exams so nothing moves under a timer. */
export default function Template({ children }: { children: React.ReactNode }) {
  const exam = /^\/mock\/[^/]+\/run/.test(usePathname());
  if (exam) return <>{children}</>;
  return <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>{children}</motion.div>;
}
