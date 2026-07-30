"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { AgentSummary } from "@/types/agents";

const AGENT_COLOR: Record<string, string> = {
  hermes: "#00f0ff",
  codex: "#8b5cf6",
  openclaw: "#ff2ee6",
};

export function AgentComparisonChart({ agents }: { agents: AgentSummary[] }) {
  const data = agents.map((a) => ({ name: a.name, completed: a.tasksCompletedToday, id: a.id }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={36}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} width={28} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          contentStyle={{
            background: "rgba(6,9,17,0.95)",
            border: "1px solid rgba(0,240,255,0.25)",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "var(--font-mono)",
          }}
        />
        <Bar dataKey="completed" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.id} fill={AGENT_COLOR[d.id]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
