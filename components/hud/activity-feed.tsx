"use client";

import { FleetActivityEvent } from "@/types/agents";
import { PlatformActivityEvent } from "@/types/activity";
import { cn } from "@/lib/utils";

type FeedItem = FleetActivityEvent | PlatformActivityEvent;

const AGENT_COLOR: Record<string, string> = {
  hermes: "text-neon-cyan border-neon-cyan/30",
  codex: "text-neon-violet border-neon-violet/30",
  openclaw: "text-neon-magenta border-neon-magenta/30",
};

const SOURCE_LABEL: Record<string, string> = {
  project: "project",
  journal: "journal",
  chat: "chat",
};

function badgeLabel(evt: FeedItem): string {
  if (evt.agentId) return evt.agentId;
  if ("source" in evt) return SOURCE_LABEL[evt.source] ?? evt.source;
  return "system";
}

function badgeColor(evt: FeedItem): string {
  if (evt.agentId) return AGENT_COLOR[evt.agentId];
  return "text-muted-foreground border-white/10";
}

export function ActivityFeed({ events }: { events: FeedItem[] }) {
  return (
    <div className="scrollbar-hud h-[26rem] space-y-2 overflow-y-auto pr-1">
      {events.map((evt) => (
        <div key={evt.id} className="flex items-start gap-3 rounded-md border border-white/5 bg-black/30 p-3">
          <span className={cn("mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider", badgeColor(evt))}>
            {badgeLabel(evt)}
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
