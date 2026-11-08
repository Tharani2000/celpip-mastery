"use client";
import { Button } from "@/components/ui/button";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="mx-auto max-w-md space-y-4 py-20 text-center"><h1 className="text-2xl font-bold">This page couldn’t load</h1><p className="text-muted-foreground">Check your connection, then try again. Your saved progress is safe.</p><Button onClick={reset}>Try again</Button></div>;
}
