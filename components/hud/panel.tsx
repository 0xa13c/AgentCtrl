"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function HudPanel({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      className={cn("hud-panel p-5", className)}
    >
      {children}
    </motion.div>
  );
}

export function PanelHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        {eyebrow && (
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{eyebrow}</p>
        )}
        <h3 className="font-display text-sm font-bold tracking-wide text-foreground">{title}</h3>
      </div>
      {right}
    </div>
  );
}
