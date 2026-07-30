"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  glow?: "cyan" | "magenta" | "violet" | "green" | "amber";
  delay?: number;
}

const GLOW: Record<NonNullable<StatTileProps["glow"]>, string> = {
  cyan: "text-neon-cyan shadow-glow-cyan border-neon-cyan/30",
  magenta: "text-neon-magenta shadow-glow-magenta border-neon-magenta/30",
  violet: "text-neon-violet shadow-glow-violet border-neon-violet/30",
  green: "text-neon-green border-neon-green/30",
  amber: "text-neon-amber border-neon-amber/30",
};

export function StatTile({ label, value, sub, icon: Icon, glow = "cyan", delay = 0 }: StatTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="hud-panel flex items-center gap-4 p-5 transition-shadow duration-300 hover:shadow-glow-cyan/40"
    >
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-black/30", GLOW[glow])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
    </motion.div>
  );
}
