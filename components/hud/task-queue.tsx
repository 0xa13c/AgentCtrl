"use client";

import { AgentTask } from "@/types/agents";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";

const STATUS_ICON: Record<AgentTask["status"], React.ComponentType<{ className?: string }>> = {
  running: Loader2,
  queued: Clock,
  completed: CheckCircle,
  failed: XCircle,
};

const STATUS_COLOR: Record<AgentTask["status"], string> = {
  running: "text-neon-cyan",
  queued: "text-muted-foreground",
  completed: "text-neon-green",
  failed: "text-neon-red",
};

export function TaskQueue({ tasks }: { tasks: AgentTask[] }) {
  return (
    <div className="scrollbar-hud h-72 space-y-2 overflow-y-auto pr-1">
      {tasks.map((task) => {
        const Icon = STATUS_ICON[task.status];
        return (
          <div key={task.id} className="rounded-md border border-white/5 bg-black/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", STATUS_COLOR[task.status], task.status === "running" && "animate-spin")} />
                <span className="truncate text-sm text-foreground">{task.title}</span>
              </div>
              <span className={cn("shrink-0 font-mono text-[10px] uppercase tracking-wider", STATUS_COLOR[task.status])}>
                {task.status}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  task.status === "failed" ? "bg-neon-red" : task.status === "completed" ? "bg-neon-green" : "bg-neon-cyan shadow-glow-cyan"
                )}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
