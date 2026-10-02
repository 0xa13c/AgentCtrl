"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FleetActivityEvent } from "@/types/agents";
import { PlatformActivityEvent } from "@/types/activity";
import { cn } from "@/lib/utils";

type FeedItem = FleetActivityEvent | PlatformActivityEvent;

const AGENT_COLOR: Record<string, string> = {
  hermes: "text-neon-cyan",
  codex: "text-neon-violet",
  openclaw: "text-neon-magenta",
};

const LAST_SEEN_KEY = "agentctrl.notifications.lastSeenAt";

export function NotificationBell() {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [lastSeenAt, setLastSeenAt] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLastSeenAt(localStorage.getItem(LAST_SEEN_KEY) ?? new Date(0).toISOString());

    function load() {
      Promise.all([
        fetch("/api/activity?limit=10").then((res) => res.json() as Promise<FleetActivityEvent[]>),
        fetch("/api/platform-activity?limit=10").then((res) => res.json() as Promise<PlatformActivityEvent[]>),
      ]).then(([fleet, platform]) => {
        const merged = [...fleet, ...platform].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 15);
        setItems(merged);
      });
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const hasUnread = items?.some((item) => item.timestamp > lastSeenAt) ?? false;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SEEN_KEY, now);
      setLastSeenAt(now);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative rounded-md border border-neon-cyan/20 p-2 text-muted-foreground transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan">
          <Bell className="h-4 w-4" />
          {hasUnread && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-neon-magenta shadow-glow-magenta" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 border-white/10 bg-void-900 p-0 text-foreground">
        <div className="border-b border-white/[0.06] px-4 py-3">
          <p className="font-display text-sm font-bold">Notifications</p>
          <p className="font-mono text-[10px] text-muted-foreground">Fleet telemetry + platform activity</p>
        </div>
        <div className="scrollbar-hud max-h-80 overflow-y-auto">
          {!items && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
          {items?.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nothing yet.</p>}
          {items?.map((item) => (
            <div key={item.id} className="border-b border-white/[0.03] px-4 py-2.5 last:border-0">
              <p className="text-xs text-foreground">
                {item.agentId && <span className={cn("mr-1.5 font-mono uppercase", AGENT_COLOR[item.agentId])}>{item.agentId}</span>}
                {item.message}
              </p>
              <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                {new Date(item.timestamp).toLocaleTimeString("en-US", { hour12: false })}
              </p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
