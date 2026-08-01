"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { HudPanel, PanelHeader } from "@/components/hud/panel";
import { AgentIcon } from "@/components/hud/agent-icon";
import { NAV_AGENTS } from "@/lib/constants";
import { useSettings } from "@/lib/settings-context";
import { VaultStatusPanel } from "@/components/settings/vault-status-panel";
import { Radio, ShieldCheck, Bell, SlidersHorizontal, Info, BookMarked } from "lucide-react";

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function SettingsView() {
  const { settings, updateSettings } = useSettings();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">configuration</p>
        <h1 className="font-display text-2xl font-black tracking-wide text-foreground">SETTINGS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control deck preferences, agent wiring, and access notes — persisted to this browser.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="hud-panel h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-1.5 sm:w-auto sm:flex-nowrap">
          <TabsTrigger value="general" className="gap-1.5 data-[state=active]:shadow-glow-cyan">
            <SlidersHorizontal className="h-3.5 w-3.5" /> General
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-1.5">
            <Radio className="h-3.5 w-3.5" /> Agent Connections
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="vault" className="gap-1.5">
            <BookMarked className="h-3.5 w-3.5" /> Obsidian Vault
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Access & Deploy
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-1.5">
            <Info className="h-3.5 w-3.5" /> About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <HudPanel>
            <PanelHeader eyebrow="deck" title="General" />
            <div className="max-w-lg divide-y divide-white/[0.06]">
              <Row label="Dashboard name" description="Shown in the sidebar and browser tab.">
                <Input
                  value={settings.dashboardName}
                  onChange={(e) => updateSettings({ dashboardName: e.target.value })}
                  className="w-40 border-white/10 bg-black/30 text-right font-mono text-sm"
                />
              </Row>
              <Row label="Telemetry refresh interval" description="How often live tiles and notifications poll the adapter.">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={3}
                    value={settings.refreshIntervalSec}
                    onChange={(e) => updateSettings({ refreshIntervalSec: Number(e.target.value) || 5 })}
                    className="w-16 border-white/10 bg-black/30 text-right font-mono text-sm"
                  />
                  <span className="font-mono text-xs text-muted-foreground">sec</span>
                </div>
              </Row>
              <Row label="Reduced motion" description="Disable staggered panel animations.">
                <Switch checked={settings.reducedMotion} onCheckedChange={(v) => updateSettings({ reducedMotion: v })} />
              </Row>
            </div>
          </HudPanel>
        </TabsContent>

        <TabsContent value="agents" className="mt-4">
          <HudPanel>
            <PanelHeader eyebrow="adapter layer" title="Agent Connections" />
            <p className="mb-4 max-w-2xl text-xs text-muted-foreground">
              Every module reads through a single <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-neon-cyan">AgentAdapter</code>{" "}
              interface, fronted by server-only API routes. It's on the mock engine right now (
              <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-neon-amber">AGENTCTRL_ADAPTER</code> unset). Two ways to go live:
            </p>
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-neon-cyan">try it now</p>
                <p className="text-sm font-semibold text-foreground">Demo bridge harnesses</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <code className="rounded bg-black/40 px-1 font-mono text-neon-cyan">docker compose --profile demo up -d</code>, then set{" "}
                  <code className="rounded bg-black/40 px-1 font-mono text-neon-cyan">AGENTCTRL_ADAPTER=redis</code> and restart. See{" "}
                  <code className="rounded bg-black/40 px-1 font-mono text-neon-cyan">harnesses/example-agent-harness</code>.
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-neon-violet">for production</p>
                <p className="text-sm font-semibold text-foreground">Write a real bridge</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Copy the example harness, replace the simulated tick + chat reply with real calls into your agent, keep the same Redis key
                  shape — the dashboard needs zero changes.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {NAV_AGENTS.map((agent) => (
                <div key={agent.id} className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/30">
                      <AgentIcon agentId={agent.id} size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{agent.label}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        redis key: <span className="text-neon-cyan">agentctrl:agent:{agent.id}:summary</span>
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-neon-amber/30 bg-neon-amber/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-neon-amber">
                    mock · not wired
                  </span>
                </div>
              ))}
            </div>
          </HudPanel>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <HudPanel>
            <PanelHeader
              eyebrow="alerts"
              title="Notifications"
              right={
                <button
                  onClick={() => toast.message("Test notification", { description: "This is what it'll look like." })}
                  className="rounded-md border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan"
                >
                  Send test
                </button>
              }
            />
            <div className="max-w-lg divide-y divide-white/[0.06]">
              <Row label="Task failures" description="Toast when any agent reports a failed task.">
                <Switch checked={settings.notifyFailures} onCheckedChange={(v) => updateSettings({ notifyFailures: v })} />
              </Row>
              <Row label="Degraded health" description="Toast when an agent's health drops to degraded/offline.">
                <Switch checked={settings.notifyDegraded} onCheckedChange={(v) => updateSettings({ notifyDegraded: v })} />
              </Row>
              <Row label="Task completions" description="Toast on every completed task (noisy — off by default).">
                <Switch checked={settings.notifyCompletion} onCheckedChange={(v) => updateSettings({ notifyCompletion: v })} />
              </Row>
              <Row label="Sound alerts" description="Play a short tone alongside visual toasts.">
                <Switch checked={settings.soundAlerts} onCheckedChange={(v) => updateSettings({ soundAlerts: v })} />
              </Row>
            </div>
          </HudPanel>
        </TabsContent>

        <TabsContent value="vault" className="mt-4 space-y-4">
          <VaultStatusPanel />
          <HudPanel delay={0.05}>
            <PanelHeader eyebrow="how it works" title="What gets synced" />
            <p className="text-sm text-muted-foreground">
              Every Project, Journal entry, and Chat thread is regenerated as Obsidian-ready markdown (with frontmatter and{" "}
              <code className="rounded bg-black/40 px-1 font-mono text-neon-cyan">[[wikilinks]]</code> for assigned agents) into a{" "}
              <code className="rounded bg-black/40 px-1 font-mono text-neon-cyan">vault/</code> folder, committed, and pushed to the repo you
              set in <code className="rounded bg-black/40 px-1 font-mono text-neon-cyan">OBSIDIAN_VAULT_REPO</code>. Clone that repo (or point
              Obsidian's Git plugin at it) on any machine to read/search everything with Obsidian.
            </p>
          </HudPanel>
        </TabsContent>

        <TabsContent value="access" className="mt-4">
          <HudPanel>
            <PanelHeader eyebrow="infrastructure" title="Access & Deploy" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-neon-green/20 bg-black/20 p-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-neon-green">recommended · active</p>
                <p className="text-sm font-semibold text-foreground">Tailscale Serve</p>
                <p className="mt-1 text-xs text-muted-foreground">Private HTTPS on your tailnet. Zero open ports on the OCI security list.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-neon-cyan">optional · future</p>
                <p className="text-sm font-semibold text-foreground">Cloudflare Tunnel</p>
                <p className="mt-1 text-xs text-muted-foreground">Outbound-only tunnel + Zero Trust Access for devices off your tailnet.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">not recommended</p>
                <p className="text-sm font-semibold text-foreground">Public Nginx</p>
                <p className="mt-1 text-xs text-muted-foreground">Only for a fully public endpoint you manage TLS for yourself.</p>
              </div>
            </div>
            <Separator className="my-5 bg-white/[0.06]" />
            <p className="text-xs text-muted-foreground">
              Full runbook lives in <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-neon-cyan">DEPLOY.md</code> at the repo root —
              container build, Redis messaging bus, and the deploy script with a{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-neon-cyan">--no-firewall</code> flag for the Tailscale/Cloudflare path.
              An optional password gate (<code className="rounded bg-black/40 px-1 py-0.5 font-mono text-neon-cyan">AGENTCTRL_PASSWORD</code>) is
              also available — see <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-neon-cyan">.env.example</code>.
            </p>
          </HudPanel>
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <HudPanel>
            <PanelHeader eyebrow="build" title="About This Deck" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Frontend", value: "Next.js 15" },
                { label: "Styling", value: "Tailwind CSS" },
                { label: "Motion", value: "Framer Motion" },
                { label: "Charts", value: "Recharts" },
                { label: "Messaging", value: "Redis" },
                { label: "Runtime", value: "Docker" },
                { label: "Host", value: "Oracle Cloud" },
                { label: "Adapter mode", value: "Mock" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-black/20 p-3">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </HudPanel>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
