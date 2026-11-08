"use client";
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
export function Progress({ value = 0, className, barClassName, animate = true, color }: { value?: number; className?: string; barClassName?: string; animate?: boolean; color?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <ProgressPrimitive.Root value={v} className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <motion.div className={cn("h-full rounded-full bg-gradient-to-r from-purple via-blue to-cyan", barClassName)} style={color ? { background: color } : undefined}
        initial={{ width: animate ? 0 : `${v}%` }} animate={{ width: `${v}%` }} transition={{ duration: animate ? 0.9 : 0, ease: [0.2, 0.8, 0.2, 1] }} />
    </ProgressPrimitive.Root>
  );
}
