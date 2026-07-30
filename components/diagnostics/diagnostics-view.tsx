"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Database, Cpu, Server, Radio } from "lucide-react";
import { HudPanel, PanelHeader } from "@/components/hud/panel";
import { StatTile } from "@/components/hud/stat-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface HealthResponse {
  ok: boolean;
  server: { uptimeSeconds: number; nodeVersion: string; env: string };
  redis: { ok: boolean; latencyMs: number | null; error?: string };
  adapterMode: "mock" | "live";
  timestamp: string;
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export function DiagnosticsView() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function poll() {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      setHealth(data);
      setError(null);
    } catch {
      setError("Could not reach /api/health");
    }
  }

  useEffect(() => {
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">system</p>
        <h1 className="font-display text-2xl font-black tracking-wide text-foreground">DIAGNOSTICS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live checks against the actual container stack — this is the real Redis connection from{" "}
          <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-neon-cyan">docker-compose.yml</code>, not mock data.
        </p>
      </div>

      {!health && !error && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {error && (
        <HudPanel>
          <p className="text-sm text-neon-red">{error}</p>
        </HudPanel>
      )}

      {health && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              label="Redis Bus"
              value={health.redis.ok ? "CONNECTED" : "UNREACHABLE"}
              sub={health.redis.ok ? `${health.redis.latencyMs}ms round-trip` : health.redis.error}
              icon={Database}
              glow={health.redis.ok ? "green" : "amber"}
            />
            <StatTile label="Server Uptime" value={formatUptime(health.server.uptimeSeconds)} icon={Server} glow="cyan" delay={0.05} />
            <StatTile label="Node Runtime" value={health.server.nodeVersion} sub={health.server.env} icon={Cpu} glow="violet" delay={0.1} />
            <StatTile
              label="Adapter Mode"
              value={health.adapterMode === "live" ? "LIVE" : "MOCK"}
              sub={health.adapterMode === "live" ? "Reading real agent endpoints" : "No live endpoints configured"}
              icon={Radio}
              glow={health.adapterMode === "live" ? "green" : "amber"}
              delay={0.15}
            />
          </div>

          <HudPanel delay={0.2}>
            <PanelHeader eyebrow="raw" title="Health Check Response" />
            <pre className="scrollbar-hud max-h-72 overflow-auto rounded-md border border-white/5 bg-black/40 p-4 font-mono text-xs text-muted-foreground">
              {JSON.stringify(health, null, 2)}
            </pre>
          </HudPanel>

          <HudPanel delay={0.25}>
            <PanelHeader eyebrow="notes" title="What this proves" />
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className={cn("flex items-center gap-2", health.redis.ok ? "text-neon-green" : "text-neon-amber")}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {health.redis.ok
                  ? "Redis is reachable — the messaging bus is ready for a real bridge harness to publish agent events onto it."
                  : "Redis isn't reachable from this container. If you're running via docker-compose, the redis service may still be starting — this should flip to CONNECTED within a few seconds."}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                Adapter mode reads {"process.env.AGENTCTRL_HERMES_URL"} — set it (see .env.example) once a real bridge exists to flip this to LIVE.
              </li>
            </ul>
          </HudPanel>
        </>
      )}
    </motion.div>
  );
}
