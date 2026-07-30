"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MetricPoint } from "@/types/agents";

export function ErrorRateChart({ data }: { data: MetricPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="t" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} width={24} unit="%" />
        <Tooltip
          contentStyle={{
            background: "rgba(6,9,17,0.95)",
            border: "1px solid rgba(255,59,92,0.3)",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "var(--font-mono)",
          }}
        />
        <Line type="monotone" dataKey="value" stroke="#ff3b5c" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
