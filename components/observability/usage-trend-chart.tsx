"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { AgentUsageSeries } from "@/types/usage";

const AGENT_COLOR: Record<string, string> = { hermes: "#00f0ff", codex: "#8b5cf6", openclaw: "#ff2ee6" };
const AGENT_LABEL: Record<string, string> = { hermes: "Hermes", codex: "Codex", openclaw: "OpenClaw" };

export function UsageTrendChart({ series, metric }: { series: AgentUsageSeries[]; metric: "costUsd" | "tokens" }) {
  const dates = series[0]?.days.map((d) => d.date.slice(5)) ?? [];
  const data = dates.map((date, i) => {
    const point: Record<string, string | number> = { date };
    for (const s of series) {
      const day = s.days[i];
      point[s.agentId] = metric === "costUsd" ? day.costUsd : day.tokensIn + day.tokensOut;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.agentId} id={`fill-${s.agentId}-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={AGENT_COLOR[s.agentId]} stopOpacity={0.4} />
              <stop offset="95%" stopColor={AGENT_COLOR[s.agentId]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} width={metric === "costUsd" ? 40 : 32} />
        <Tooltip
          contentStyle={{ background: "rgba(6,9,17,0.95)", border: "1px solid rgba(0,240,255,0.25)", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-mono)" }}
          formatter={(value: number, name: string) => [metric === "costUsd" ? `$${value.toFixed(2)}` : value, AGENT_LABEL[name] ?? name]}
        />
        <Legend
          formatter={(value: string) => AGENT_LABEL[value] ?? value}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#8fa3b0" }}
        />
        {series.map((s) => (
          <Area
            key={s.agentId}
            type="monotone"
            dataKey={s.agentId}
            stroke={AGENT_COLOR[s.agentId]}
            strokeWidth={2}
            fill={`url(#fill-${s.agentId}-${metric})`}
            stackId="1"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
