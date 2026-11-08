"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/brand-logo";
import { FloatingLeaves } from "@/components/floating-leaves";
import { APP_TAGLINE } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setBusy(true);
    const f = new FormData(e.currentTarget); const email = String(f.get("email")), password = String(f.get("password"));
    try {
      if (mode === "register") {
        const r = await fetch("/api/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: f.get("name"), email, password }) });
        if (!r.ok) { setError((await r.json()).error ?? "Couldn’t create your account."); return; }
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) { setError("That email and password don’t match an account."); return; }
      router.replace("/dashboard"); router.refresh();
    } catch { setError("Couldn’t reach the server. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden p-4">
      <FloatingLeaves />
      <div aria-hidden className="blob pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-purple/25 blur-3xl" />
      <div aria-hidden className="blob pointer-events-none absolute -right-20 bottom-10 size-80 rounded-full bg-cyan/25 blur-3xl [animation-delay:-6s]" />
      <motion.div className="relative z-10 w-full max-w-md" initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
      <Card className="w-full p-7">
        <div className="mb-2"><BrandLogo size="lg" /></div>
        <p className="mb-6 text-sm font-bold text-purple">{APP_TAGLINE}</p>
        <h1 className="text-2xl font-bold">{mode === "login" ? <>Welcome back <span className="inline-block animate-wave">👋</span></> : <>Join the fun <span className="inline-block animate-wave">🎉</span></>}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? "Sign in to continue your preparation." : "Advanced practice for CELPIP 9–12, with honest feedback."}</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "register" && <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" name="name" autoComplete="name" required maxLength={60} /></div>}
          <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
          <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 8 : 1} />{mode === "register" && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}</div>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">{mode === "login" ? <>New here? <Link className="font-bold text-primary" href="/register">Create an account</Link></> : <>Already have an account? <Link className="font-bold text-primary" href="/login">Sign in</Link></>}</p>
      </Card>
      </motion.div>
    </main>
  );
}
