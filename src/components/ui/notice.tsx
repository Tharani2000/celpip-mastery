import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
export function Notice({ tone = "info", children, className }: { tone?: "info" | "warning" | "success" | "error"; children: React.ReactNode; className?: string }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertTriangle;
  return (
    <div role={tone === "error" ? "alert" : undefined} className={cn("flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm", { info: "bg-blue/10", warning: "bg-warning/15", success: "bg-success/15", error: "bg-destructive/15" }[tone], className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><div>{children}</div>
    </div>
  );
}
