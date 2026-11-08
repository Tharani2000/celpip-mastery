import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold [&_svg]:size-3.5", {
  variants: { variant: {
    default: "bg-secondary text-secondary-foreground", primary: "bg-accent text-accent-foreground", blue: "bg-blue/15 text-blue", cyan: "bg-cyan/15 text-cyan",
    success: "bg-success/15 text-success", warning: "bg-warning/15 text-warning", destructive: "bg-destructive/15 text-destructive"
  } }, defaultVariants: { variant: "default" }
});
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, variant, ...props }: BadgeProps) { return <span className={cn(badgeVariants({ variant }), className)} {...props} />; }
