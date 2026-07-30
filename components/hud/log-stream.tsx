"use client";

import { LogEntry } from "@/types/agents";
import { cn } from "@/lib/utils";

const LEVEL_COLOR: Record<LogEntry["level"], string> = {
  info: "text-neon-cyan",
  warn: "text-neon-amber",
  error: "text-neon-red",
  debug: "text-muted-foreground",
};

export function LogStream({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="scrollbar-hud h-72 space-y-1.5 overflow-y-auto rounded-md border border-white/5 bg-black/40 p-3 font-mono text-xs">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-2 leading-relaxed">
          <span className="shrink-0 text-muted-foreground/60">
            {new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false })}
          </span>
          <span className={cn("shrink-0 font-semibold uppercase", LEVEL_COLOR[log.level])}>[{log.level}]</span>
          <span className="text-muted-foreground">{log.message}</span>
        </div>
      ))}
    </div>
  );
}
