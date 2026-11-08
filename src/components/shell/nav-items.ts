import { CalendarDays, LayoutDashboard, Headphones, BookOpen, PenLine, Mic, ClipboardCheck, Layers, TrendingUp, Trophy, User, SlidersHorizontal } from "lucide-react";
export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/plan", label: "My Plan", icon: CalendarDays },
  { href: "/listening", label: "Listening", icon: Headphones },
  { href: "/reading", label: "Reading", icon: BookOpen }, { href: "/writing", label: "Writing", icon: PenLine },
  { href: "/speaking", label: "Speaking", icon: Mic }, { href: "/mock", label: "Mock Tests", icon: ClipboardCheck },
  { href: "/vocabulary", label: "Vocabulary", icon: Layers }, { href: "/progress", label: "My Progress", icon: TrendingUp },
  { href: "/achievements", label: "Achievements", icon: Trophy }, { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal }
] as const;
