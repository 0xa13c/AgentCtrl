"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Eye, Terminal as TerminalIcon, Download, Trash2, Send, Loader2, AlertTriangle } from "lucide-react";
import { AgentId } from "@/types/agents";
import { NAV_AGENTS } from "@/lib/constants";
import { AgentIcon } from "@/components/hud/agent-icon";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { LiveTerminalHandle } from "@/components/terminal/live-terminal";
import { cn } from "@/lib/utils";

// xterm.js touches window/document at module load — must never run during SSR.
const LiveTerminal = dynamic(() => import("@/components/terminal/live-terminal").then((m) => m.LiveTerminal), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading terminal...</div>,
});

const AGENT_TAB_STYLE: Record<AgentId, string> = {
  hermes: "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan shadow-glow-cyan",
  codex: "border-neon-violet/50 bg-neon-violet/10 text-neon-violet shadow-glow-violet",
  openclaw: "border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta shadow-glow-magenta",
};

export function TerminalView() {
  const [activeAgent, setActiveAgent] = useState<AgentId>("hermes");
  const [interactive, setInteractive] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [command, setCommand] = useState("");
  const [sending, setSending] = useState(false);
  const termRef = useRef<LiveTerminalHandle>(null);

  function toggleInteractive(checked: boolean) {
    if (checked) {
      setConfirming(true);
    } else {
      setInteractive(false);
    }
  }

  function confirmEnableInteractive() {
    setInteractive(true);
    setConfirming(false);
  }

  async function sendCommand() {
    if (!command.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/terminal/${activeAgent}/input`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      setCommand("");
    } finally {
      setSending(false);
    }
  }

  async function downloadLog() {
    const res = await fetch(`/api/terminal/${activeAgent}/output?cursor=0&limit=5000`);
    const data = await res.json();
    // eslint-disable-next-line no-control-regex
    const plain = data.chunks.join("").replace(/\x1b\[[0-9;]*m/g, "");
    const blob = new Blob([plain], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeAgent}-terminal-${new Date().toISOString().slice(0, 19)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col gap-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">live work</p>
        <h1 className="font-display text-2xl font-black tracking-wide text-foreground">TERMINAL</h1>
        <p className="mt-1 text-sm text-muted-foreground">Watch an agent's real terminal output as it works. Read-only by default.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {NAV_AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setActiveAgent(agent.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all",
                activeAgent === agent.id ? AGENT_TAB_STYLE[agent.id] : "border-white/10 text-muted-foreground hover:border-white/20"
              )}
            >
              <AgentIcon agentId={agent.id} size={16} />
              {agent.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={downloadLog}
            className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan"
          >
            <Download className="h-3.5 w-3.5" /> Download log
          </button>
          <button
            onClick={() => termRef.current?.clear()}
            className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-white/30"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear view
          </button>
          <div className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5">
            {interactive ? <TerminalIcon className="h-3.5 w-3.5 text-neon-amber" /> : <Eye className="h-3.5 w-3.5 text-neon-green" />}
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Interactive</span>
            <Switch checked={interactive} onCheckedChange={toggleInteractive} />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-wider",
          interactive ? "border-neon-amber/30 bg-neon-amber/10 text-neon-amber" : "border-neon-green/30 bg-neon-green/10 text-neon-green"
        )}
      >
        {interactive ? <TerminalIcon className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {interactive ? "INTERACTIVE — commands you send are forwarded to this agent's real session" : "OBSERVING — read-only, nothing you do here reaches the agent"}
      </div>

      <div className="hud-panel flex-1 overflow-hidden p-2">
        <LiveTerminal key={activeAgent} ref={termRef} agentId={activeAgent} />
      </div>

      {interactive && (
        <div className="flex items-center gap-2">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendCommand()}
            placeholder={`Send a command to ${activeAgent}'s terminal...`}
            className="flex-1 border-neon-amber/20 bg-black/30 font-mono text-sm"
          />
          <button
            onClick={sendCommand}
            disabled={sending || !command.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neon-amber/40 bg-neon-amber/10 text-neon-amber transition-all hover:shadow-glow-red disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="hud-panel max-w-md p-6">
            <div className="mb-3 flex items-center gap-2 text-neon-amber">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-display font-bold">Enable interactive mode?</p>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Commands you send will be forwarded into this agent's real terminal session and executed. Only enable this if you
              trust what you're about to type — this is the most privileged action in the dashboard, and every command is
              recorded in the audit log.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-md border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:border-white/30"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnableInteractive}
                className="rounded-md border border-neon-amber/40 bg-neon-amber/10 px-4 py-2 text-sm font-semibold text-neon-amber hover:shadow-glow-red"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
