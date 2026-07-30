"use client";

import { useState } from "react";
import { Play, Square, RotateCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentId } from "@/types/agents";
import { getAdapter } from "@/lib/agents/adapter";

export function ControlPanel({ agentId }: { agentId: AgentId }) {
  const [pending, setPending] = useState<string | null>(null);

  async function run(command: "start" | "stop" | "restart") {
    setPending(command);
    await getAdapter().sendCommand(agentId, command);
    setPending(null);
  }

  const actions = [
    { key: "start" as const, label: "Start", icon: Play, glow: "hover:border-neon-green/60 hover:text-neon-green hover:shadow-glow-green" },
    { key: "restart" as const, label: "Restart", icon: RotateCw, glow: "hover:border-neon-cyan/60 hover:text-neon-cyan hover:shadow-glow-cyan" },
    { key: "stop" as const, label: "Stop", icon: Square, glow: "hover:border-neon-red/60 hover:text-neon-red hover:shadow-glow-red" },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={() => run(action.key)}
          disabled={pending !== null}
          className={cn(
            "flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-4 py-2 text-sm text-muted-foreground transition-all duration-200 disabled:opacity-50",
            action.glow
          )}
        >
          {pending === action.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <action.icon className="h-4 w-4" />}
          {action.label}
        </button>
      ))}
    </div>
  );
}
