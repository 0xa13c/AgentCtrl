"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Loader2, CheckCircle2, AlertTriangle, CircleDashed } from "lucide-react";
import { HudPanel, PanelHeader } from "@/components/hud/panel";
import { cn } from "@/lib/utils";

interface VaultSyncResult {
  ok: boolean;
  synced: boolean;
  message: string;
  timestamp: string;
}
interface VaultStatus {
  configured: boolean;
  running: boolean;
  lastRun: VaultSyncResult | null;
  intervalMinutes: number;
}

export function VaultStatusPanel() {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [syncing, setSyncing] = useState(false);

  function load() {
    fetch("/api/vault/status")
      .then((res) => res.json())
      .then(setStatus);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function syncNow() {
    setSyncing(true);
    try {
      await fetch("/api/vault/sync", { method: "POST" });
      load();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <HudPanel>
      <PanelHeader
        eyebrow="obsidian"
        title="Vault Sync"
        right={
          <button
            onClick={syncNow}
            disabled={syncing || !status?.configured}
            className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan disabled:opacity-40"
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync now
          </button>
        }
      />

      {!status ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !status.configured ? (
        <div className="rounded-lg border border-neon-amber/20 bg-neon-amber/5 p-4">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-neon-amber">
            <CircleDashed className="h-4 w-4" /> Not configured
          </p>
          <p className="text-xs text-muted-foreground">
            Set <code className="rounded bg-black/40 px-1 font-mono text-neon-cyan">OBSIDIAN_VAULT_REPO</code> (and{" "}
            <code className="rounded bg-black/40 px-1 font-mono text-neon-cyan">OBSIDIAN_VAULT_TOKEN</code> to actually push) in your{" "}
            <code className="rounded bg-black/40 px-1 font-mono text-neon-cyan">.env</code> and restart the container. Projects, Journal
            entries, and Chat threads will then sync to that repo every {status.intervalMinutes} minutes as Obsidian-ready markdown.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider",
                status.lastRun?.ok === false
                  ? "border-neon-red/30 bg-neon-red/10 text-neon-red"
                  : status.lastRun?.synced
                  ? "border-neon-green/30 bg-neon-green/10 text-neon-green"
                  : "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
              )}
            >
              {status.lastRun?.ok === false ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
              {status.running ? "syncing..." : status.lastRun ? (status.lastRun.synced ? "synced" : "up to date") : "waiting for first sync"}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">every {status.intervalMinutes} min + on demand</span>
          </div>
          {status.lastRun && (
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
              <p className="text-sm text-foreground">{status.lastRun.message}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {new Date(status.lastRun.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </HudPanel>
  );
}
