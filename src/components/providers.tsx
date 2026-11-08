"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { Toaster } from "./toaster";
import { GlobalLoader } from "./loader/global-loader";
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <MotionConfig reducedMotion="user"><Toaster>{children}<GlobalLoader /></Toaster></MotionConfig>
      </ThemeProvider>
    </SessionProvider>
  );
}
