"use client";
import { motion } from "framer-motion";
import { APP_EMOJI, APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Animated app logo: the leaf sways, wiggles on hover and spins on tap. */
export function BrandLogo({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  const lg = size === "lg";
  return (
    <span className={cn("flex items-center gap-2.5 font-display font-extrabold tracking-tight", lg ? "text-xl" : "text-lg", className)}>
      <motion.span whileHover={{ rotate: [0, -14, 12, -8, 0], scale: 1.1 }} whileTap={{ rotate: 360, scale: 0.9 }} transition={{ duration: 0.6 }}
        className={cn("logo-gradient grid place-items-center rounded-xl shadow-lg", lg ? "size-10 text-2xl" : "size-9 text-xl")} aria-hidden>
        <span className="animate-leaf-sway inline-block">{APP_EMOJI}</span>
      </motion.span>
      <span className="text-shimmer">{APP_NAME}</span>
    </span>
  );
}
