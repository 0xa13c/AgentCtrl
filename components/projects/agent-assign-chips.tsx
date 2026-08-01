"use client";

import { AgentId } from "@/types/agents";
import { AgentIcon } from "@/components/hud/agent-icon";
import { NAV_AGENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const RING: Record<AgentId, string> = {
  hermes: "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan",
  codex: "border-neon-violet/50 bg-neon-violet/10 text-neon-violet",
  openclaw: "border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta",
};

export function AgentAssignChips({
  selected,
  onToggle,
  interactive = true,
}: {
  selected: AgentId[];
  onToggle?: (id: AgentId) => void;
  interactive?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {NAV_AGENTS.map((agent) => {
        const active = selected.includes(agent.id);
        return (
          <button
            key={agent.id}
            type="button"
            disabled={!interactive}
            onClick={() => onToggle?.(agent.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-all",
              active ? RING[agent.id] : "border-white/10 bg-black/20 text-muted-foreground",
              interactive && "cursor-pointer hover:opacity-80",
              !interactive && "cursor-default"
            )}
          >
            <AgentIcon agentId={agent.id} size={12} />
            {agent.label}
          </button>
        );
      })}
    </div>
  );
}
