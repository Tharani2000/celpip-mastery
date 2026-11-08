"use client";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
export const Tabs = TabsPrimitive.Root;
export const TabsList = ({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.List>) => <TabsPrimitive.List className={cn("inline-flex flex-wrap gap-1 rounded-2xl bg-secondary p-1", className)} {...p} />;
export const TabsTrigger = ({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => <TabsPrimitive.Trigger className={cn("rounded-xl px-3.5 py-2 text-sm font-bold text-muted-foreground transition data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow", className)} {...p} />;
export const TabsContent = ({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.Content>) => <TabsPrimitive.Content className={cn("mt-5 focus-visible:outline-none", className)} {...p} />;
