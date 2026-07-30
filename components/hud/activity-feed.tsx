"use client";

import { FleetActivityEvent } from "@/types/agents";
import { cn } from "@/lib/utils";

const AGENT_COLOR: Record<string, string> = {
  hermes: "text-neon-cyan border-neon-cyan/30",
  codex: "text-neon-violet border-neon-violet/30",
  openclaw: "text-neon-magenta border-neon-magenta/30",
};

export function ActivityFeed({ events }: { events: FleetActivityEvent[] }) {
  return (
    <div className="scrollbar-hud h-[26rem] space-y-2 overflow-y-auto pr-1">
      {events.map((evt) => (
        <div key={evt.id} className="flex items-start gap-3 rounded-md border border-white/5 bg-black/30 p-3">
          <span className={cn("mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider", AGENT_COLOR[evt.agentId])}>
            {evt.agentId}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{evt.message}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {new Date(evt.timestamp).toLocaleTimeString("en-US", { hour12: false })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
