import { Skeleton } from "@/components/ui/skeleton";
/** Instant skeleton on navigation; the global loader overlay joins in if the page takes longer than a moment. */
export default function Loading() {
  return <div className="space-y-5" aria-busy="true" aria-label="Loading"><Skeleton className="h-10 w-64" /><Skeleton className="h-48 w-full" /><div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}</div></div>;
}
