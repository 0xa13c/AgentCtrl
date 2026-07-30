"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";
import { MetricPoint } from "@/types/agents";

export function Sparkline({ data, color = "#00f0ff" }: { data: MetricPoint[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
