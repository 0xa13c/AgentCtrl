import { cn } from "@/lib/utils";
import { AgentHealth } from "@/types/agents";

const CONFIG: Record<AgentHealth, { label: string; dot: string; text: string }> = {
  online: { label: "ONLINE", dot: "bg-neon-green shadow-glow-green", text: "text-neon-green" },
  degraded: { label: "DEGRADED", dot: "bg-neon-amber", text: "text-neon-amber" },
  offline: { label: "OFFLINE", dot: "bg-neon-red shadow-glow-red", text: "text-neon-red" },
  paused: { label: "PAUSED", dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

export function StatusBadge({ health }: { health: AgentHealth }) {
  const c = CONFIG[health];
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot, health === "online" && "animate-pulse-glow")} />
      <span className={cn("font-mono text-[10px] tracking-widest", c.text)}>{c.label}</span>
    </div>
  );
}
