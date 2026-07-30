"use client";

import { motion } from "framer-motion";
import { AgentDetail } from "@/types/agents";
import { StatusBadge } from "@/components/hud/status-badge";
import { ControlPanel } from "@/components/hud/control-panel";
import { AgentIcon } from "@/components/hud/agent-icon";
import { cn } from "@/lib/utils";

const BADGE_BG: Record<string, string> = {
  hermes: "bg-neon-cyan/10 border-neon-cyan/30 shadow-glow-cyan",
  codex: "bg-neon-violet/10 border-neon-violet/30 shadow-glow-violet",
  openclaw: "bg-neon-magenta/10 border-neon-magenta/30 shadow-glow-magenta",
};

export function AgentHeader({ agent, glow = "cyan" }: { agent: AgentDetail; glow?: "cyan" | "magenta" | "violet" }) {
  const glowText = glow === "cyan" ? "text-neon-cyan text-glow-cyan" : glow === "magenta" ? "text-neon-magenta text-glow-magenta" : "text-neon-violet";

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="hud-panel flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-center gap-4">
        <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border", BADGE_BG[agent.id])}>
          <AgentIcon agentId={agent.id} size={30} />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">agent module</p>
          <h1 className={cn("font-display text-3xl font-black tracking-wide", glowText)}>{agent.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{agent.tagline}</p>
        </div>
      </div>
      <div className="flex flex-col items-start gap-3 md:items-end">
        <StatusBadge health={agent.health} />
        <ControlPanel agentId={agent.id} />
      </div>
    </motion.div>
  );
}
