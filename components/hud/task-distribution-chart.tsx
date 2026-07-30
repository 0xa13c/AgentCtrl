"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AgentSummary } from "@/types/agents";

const COLORS = {
  active: "#00f0ff",
  queued: "#8b5cf6",
  completed: "#39ff8a",
  failed: "#ff3b5c",
};

export function TaskDistributionChart({ agents }: { agents: AgentSummary[] }) {
  const data = [
    { name: "Active", value: agents.reduce((s, a) => s + a.activeTasks, 0), color: COLORS.active },
    { name: "Queued", value: agents.reduce((s, a) => s + a.queuedTasks, 0), color: COLORS.queued },
    { name: "Completed", value: agents.reduce((s, a) => s + a.tasksCompletedToday, 0), color: COLORS.completed },
    { name: "Failed", value: agents.reduce((s, a) => s + a.tasksFailedToday, 0), color: COLORS.failed },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} strokeWidth={0}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "rgba(6,9,17,0.95)",
              border: "1px solid rgba(0,240,255,0.25)",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={24}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#8fa3b0" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute left-1/2 top-[92px] -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="font-display text-2xl font-bold text-foreground">{total}</p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">tasks today</p>
      </div>
    </div>
  );
}
