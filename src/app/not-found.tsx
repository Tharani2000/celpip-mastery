import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return <main className="grid min-h-screen place-items-center p-6 text-center"><div className="space-y-4"><div className="animate-float text-7xl" aria-hidden>🫎</div><h1 className="text-3xl font-bold">Oops, this moose wandered off</h1><p className="text-muted-foreground">The page doesn’t exist, or the link may be out of date. Sorry, eh!</p><Button asChild><Link href="/dashboard">Take me home 🌺</Link></Button></div></main>;
}
