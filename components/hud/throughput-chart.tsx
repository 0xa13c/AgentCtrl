"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MetricPoint } from "@/types/agents";

export function ThroughputChart({ data, color = "#00f0ff" }: { data: MetricPoint[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="fillThroughput" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.5} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="t" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} width={28} />
        <Tooltip
          contentStyle={{
            background: "rgba(6,9,17,0.95)",
            border: "1px solid rgba(0,240,255,0.25)",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "var(--font-mono)",
          }}
          labelStyle={{ color: "#8fa3b0" }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#fillThroughput)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
