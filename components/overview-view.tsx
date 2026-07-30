"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, ListTodo, AlertTriangle, Gauge, ArrowRight } from "lucide-react";
import { AgentSummary, FleetActivityEvent } from "@/types/agents";
import { getAdapter } from "@/lib/agents/adapter";
import { StatTile } from "@/components/hud/stat-tile";
import { HudPanel, PanelHeader } from "@/components/hud/panel";
import { StatusBadge } from "@/components/hud/status-badge";
import { ActivityFeed } from "@/components/hud/activity-feed";
import { AgentIcon } from "@/components/hud/agent-icon";
import { TaskDistributionChart } from "@/components/hud/task-distribution-chart";
import { AgentComparisonChart } from "@/components/hud/agent-comparison-chart";
import { Skeleton } from "@/components/ui/skeleton";

const AGENT_ROUTE: Record<string, string> = { hermes: "/hermes", codex: "/codex", openclaw: "/openclaw" };
const AGENT_RING: Record<string, string> = {
  hermes: "hover:border-neon-cyan/50 hover:shadow-glow-cyan",
  codex: "hover:border-neon-violet/50 hover:shadow-glow-violet",
  openclaw: "hover:border-neon-magenta/50 hover:shadow-glow-magenta",
};
const AGENT_BADGE_BG: Record<string, string> = {
  hermes: "bg-neon-cyan/10 border-neon-cyan/30",
  codex: "bg-neon-violet/10 border-neon-violet/30",
  openclaw: "bg-neon-magenta/10 border-neon-magenta/30",
};

export function OverviewView() {
  const [agents, setAgents] = useState<AgentSummary[] | null>(null);
  const [activity, setActivity] = useState<FleetActivityEvent[] | null>(null);

  useEffect(() => {
    const adapter = getAdapter();
    adapter.listAgents().then(setAgents);
    adapter.getFleetActivity(24).then(setActivity);
  }, []);

  const totalActive = agents?.reduce((sum, a) => sum + a.activeTasks, 0) ?? 0;
  const totalQueued = agents?.reduce((sum, a) => sum + a.queuedTasks, 0) ?? 0;
  const totalCompleted = agents?.reduce((sum, a) => sum + a.tasksCompletedToday, 0) ?? 0;
  const avgErrorRate = agents ? (agents.reduce((s, a) => s + a.errorRate, 0) / agents.length).toFixed(2) : "0.00";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Active Tasks" value={String(totalActive)} icon={Bot} glow="cyan" delay={0.0} />
        <StatTile label="Queued Tasks" value={String(totalQueued)} icon={ListTodo} glow="violet" delay={0.05} />
        <StatTile label="Completed Today" value={String(totalCompleted)} icon={Gauge} glow="green" delay={0.1} />
        <StatTile label="Fleet Error Rate" value={`${avgErrorRate}%`} icon={AlertTriangle} glow="amber" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <PanelHeader eyebrow="fleet" title="Agent Roster" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {!agents &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl bg-white/5" />)}
            {agents?.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 * i, ease: "easeOut" }}
              >
                <Link href={AGENT_ROUTE[agent.id]} className="block">
                  <div className={`hud-card group h-full p-5 ${AGENT_RING[agent.id]}`}>
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${AGENT_BADGE_BG[agent.id]}`}>
                          <AgentIcon agentId={agent.id} size={24} />
                        </div>
                        <div>
                          <p className="font-display text-lg font-bold leading-tight text-foreground">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.tagline}</p>
                        </div>
                      </div>
                      <StatusBadge health={agent.health} />
                    </div>

                    <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-black/20 py-2">
                        <p className="font-display text-lg font-bold text-foreground">{agent.activeTasks}</p>
                        <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">active</p>
                      </div>
                      <div className="rounded-lg bg-black/20 py-2">
                        <p className="font-display text-lg font-bold text-foreground">{agent.queuedTasks}</p>
                        <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">queued</p>
                      </div>
                      <div className="rounded-lg bg-black/20 py-2">
                        <p className="font-display text-lg font-bold text-foreground">{agent.cpuPct}%</p>
                        <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">cpu</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 font-mono text-[10px] text-muted-foreground">
                      <span>open module</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <HudPanel delay={0.3}>
              <PanelHeader eyebrow="fleet-wide" title="Task Distribution" />
              {agents ? <TaskDistributionChart agents={agents} /> : <Skeleton className="h-56 rounded-lg bg-white/5" />}
            </HudPanel>
            <HudPanel delay={0.35}>
              <PanelHeader eyebrow="fleet-wide" title="Completed Today by Agent" />
              {agents ? <AgentComparisonChart agents={agents} /> : <Skeleton className="h-56 rounded-lg bg-white/5" />}
            </HudPanel>
          </div>
        </div>

        <HudPanel delay={0.2}>
          <PanelHeader eyebrow="live" title="Fleet Activity" />
          {activity ? <ActivityFeed events={activity} /> : <Skeleton className="h-96 rounded-lg bg-white/5" />}
        </HudPanel>
      </div>
    </div>
  );
}
