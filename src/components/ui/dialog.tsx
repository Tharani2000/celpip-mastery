"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Dialog = DialogPrimitive.Root;
export function DialogContent({ className, children, ...p }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-[22px] border bg-card p-6 shadow-2xl data-[state=open]:animate-in data-[state=open]:zoom-in-95", className)} {...p}>{children}</DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
export const DialogTitle = ({ className, ...p }: React.ComponentProps<typeof DialogPrimitive.Title>) => <DialogPrimitive.Title className={cn("font-display text-xl font-bold", className)} {...p} />;
export const DialogDescription = ({ className, ...p }: React.ComponentProps<typeof DialogPrimitive.Description>) => <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...p} />;

/** Promise-free confirm dialog used before submissions and when leaving exercises. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Continue", cancelLabel = "Cancel", destructive, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={() => { onOpenChange(false); onConfirm(); }} data-testid="confirm">{confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
