"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Coins, ReceiptText, CircleDashed } from "lucide-react";
import { AgentUsageSeries } from "@/types/usage";
import { AuditEvent } from "@/types/audit";
import { HudPanel, PanelHeader } from "@/components/hud/panel";
import { StatTile } from "@/components/hud/stat-tile";
import { UsageTrendChart } from "@/components/observability/usage-trend-chart";
import { AuditLogTable } from "@/components/observability/audit-log-table";
import { Skeleton } from "@/components/ui/skeleton";

export function ObservabilityView() {
  const [series, setSeries] = useState<AgentUsageSeries[] | null>(null);
  const [hasData, setHasData] = useState(false);
  const [audit, setAudit] = useState<AuditEvent[] | null>(null);

  useEffect(() => {
    fetch("/api/usage?days=14")
      .then((res) => res.json())
      .then((data) => {
        setSeries(data.series);
        setHasData(data.hasData);
      });
    fetch("/api/audit?limit=100")
      .then((res) => res.json())
      .then(setAudit);
  }, []);

  const todayTotalCost = series?.reduce((sum, s) => sum + (s.days[s.days.length - 1]?.costUsd ?? 0), 0) ?? 0;
  const windowTotalCost = series?.reduce((sum, s) => sum + s.totalCostUsd, 0) ?? 0;
  const windowTotalTokens = series?.reduce((sum, s) => sum + s.totalTokens, 0) ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">telemetry</p>
        <h1 className="font-display text-2xl font-black tracking-wide text-foreground">OBSERVABILITY</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cost/token usage and the full action audit trail — real reported data only, never estimated.</p>
      </div>

      {!series && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {series && !hasData && (
        <HudPanel>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CircleDashed className="h-8 w-8 text-neon-amber" />
            <p className="text-sm font-semibold text-foreground">No usage data reported yet</p>
            <p className="max-w-lg text-xs text-muted-foreground">
              Cost and token numbers only ever come from a real bridge — nothing here is estimated or synthesized. Have your harness
              (or any agent process) report usage after each run:
            </p>
            <pre className="scrollbar-hud max-w-lg overflow-x-auto rounded-md border border-white/5 bg-black/40 p-3 text-left font-mono text-[11px] text-muted-foreground">
{`curl -X POST http://agentctrl:3000/api/usage \\
  -H "Content-Type: application/json" \\
  -H "X-Agent-Token: $AGENTCTRL_AGENT_TOKEN" \\
  -d '{"agentId":"hermes","tokensIn":1200,"tokensOut":340,"costUsd":0.014}'`}
            </pre>
          </div>
        </HudPanel>
      )}

      {series && hasData && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile label="Cost Today" value={`$${todayTotalCost.toFixed(2)}`} icon={DollarSign} glow="green" />
            <StatTile label="Cost (14 days)" value={`$${windowTotalCost.toFixed(2)}`} icon={ReceiptText} glow="cyan" delay={0.05} />
            <StatTile label="Tokens (14 days)" value={windowTotalTokens.toLocaleString()} icon={Coins} glow="violet" delay={0.1} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <HudPanel delay={0.15}>
              <PanelHeader eyebrow="14-day trend" title="Cost by Agent" />
              <UsageTrendChart series={series} metric="costUsd" />
            </HudPanel>
            <HudPanel delay={0.2}>
              <PanelHeader eyebrow="14-day trend" title="Token Usage by Agent" />
              <UsageTrendChart series={series} metric="tokens" />
            </HudPanel>
          </div>
        </>
      )}

      <HudPanel delay={0.25}>
        <PanelHeader eyebrow="security" title="Audit Log" />
        {audit ? <AuditLogTable events={audit} /> : <Skeleton className="h-64 rounded-lg bg-white/5" />}
      </HudPanel>
    </motion.div>
  );
}
