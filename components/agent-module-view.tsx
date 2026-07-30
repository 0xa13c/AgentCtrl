"use client";

import { useEffect, useState } from "react";
import { Cpu, MemoryStick, ListChecks, Timer } from "lucide-react";
import { AgentDetail, AgentId } from "@/types/agents";
import { AgentHeader } from "@/components/hud/agent-header";
import { StatTile } from "@/components/hud/stat-tile";
import { HudPanel, PanelHeader } from "@/components/hud/panel";
import { ThroughputChart } from "@/components/hud/throughput-chart";
import { ErrorRateChart } from "@/components/hud/error-rate-chart";
import { TaskQueue } from "@/components/hud/task-queue";
import { LogStream } from "@/components/hud/log-stream";
import { Skeleton } from "@/components/ui/skeleton";

const GLOW_HEX: Record<"cyan" | "magenta" | "violet", string> = {
  cyan: "#00f0ff",
  magenta: "#ff2ee6",
  violet: "#8b5cf6",
};

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function AgentModuleView({ agentId, glow }: { agentId: AgentId; glow: "cyan" | "magenta" | "violet" }) {
  const [agent, setAgent] = useState<AgentDetail | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/agents/${agentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setAgent(data);
      });
    return () => {
      active = false;
    };
  }, [agentId]);

  if (!agent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-lg bg-white/5" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AgentHeader agent={agent} glow={glow} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="CPU Load" value={`${agent.cpuPct}%`} icon={Cpu} glow={glow} delay={0.05} />
        <StatTile label="Memory" value={`${agent.memPct}%`} icon={MemoryStick} glow={glow} delay={0.1} />
        <StatTile
          label="Active / Queued"
          value={`${agent.activeTasks} / ${agent.queuedTasks}`}
          icon={ListChecks}
          glow={glow}
          delay={0.15}
        />
        <StatTile label="Uptime" value={formatUptime(agent.uptimeSeconds)} icon={Timer} glow={glow} delay={0.2} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <HudPanel className="lg:col-span-2" delay={0.25}>
          <PanelHeader eyebrow="telemetry" title="Task Throughput (24h)" />
          <ThroughputChart data={agent.throughput} color={GLOW_HEX[glow]} />
        </HudPanel>

        <HudPanel delay={0.3}>
          <PanelHeader eyebrow="queue" title="Tasks" />
          <TaskQueue tasks={agent.tasks} />
        </HudPanel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <HudPanel className="lg:col-span-2" delay={0.35}>
          <PanelHeader eyebrow="stdout" title="Live Log Stream" />
          <LogStream logs={agent.logs} />
        </HudPanel>

        <HudPanel delay={0.4}>
          <PanelHeader eyebrow="reliability" title="Error Rate (24h)" />
          <ErrorRateChart data={agent.errorHistory} />
        </HudPanel>
      </div>
    </div>
  );
}
