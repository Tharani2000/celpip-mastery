"use client";
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";
export const Label = ({ className, ...p }: React.ComponentProps<typeof LabelPrimitive.Root>) => <LabelPrimitive.Root className={cn("text-sm font-bold", className)} {...p} />;
