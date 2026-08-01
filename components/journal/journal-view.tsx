"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Plus } from "lucide-react";
import { JournalEntry } from "@/types/journal";
import { AgentId } from "@/types/agents";
import { NAV_AGENTS } from "@/lib/constants";
import { JournalEntryCard } from "@/components/journal/journal-entry-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AgentIcon } from "@/components/hud/agent-icon";
import { cn } from "@/lib/utils";

export function JournalView() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [filter, setFilter] = useState<AgentId | "all">("all");
  const [composeAgent, setComposeAgent] = useState<AgentId>("hermes");
  const [composeText, setComposeText] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    const qs = filter === "all" ? "" : `?agentId=${filter}`;
    fetch(`/api/journal${qs}`)
      .then((res) => res.json())
      .then(setEntries);
  }

  useEffect(load, [filter]);

  async function submitEntry() {
    if (!composeText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: composeAgent, content: composeText }),
      });
      if (res.ok) {
        setComposeText("");
        load();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">memory</p>
        <h1 className="font-display text-2xl font-black tracking-wide text-foreground">JOURNAL</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One entry per agent per day — a durable record of what got done, so a context-compacted agent can check here
          instead of redoing work.
        </p>
      </div>

      <div className="hud-panel p-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Add an entry (agents can also POST to /api/journal directly)</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {NAV_AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setComposeAgent(agent.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-all",
                composeAgent === agent.id ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan" : "border-white/10 bg-black/20 text-muted-foreground"
              )}
            >
              <AgentIcon agentId={agent.id} size={12} />
              {agent.label}
            </button>
          ))}
        </div>
        <Textarea
          value={composeText}
          onChange={(e) => setComposeText(e.target.value)}
          placeholder="What did this agent accomplish today?"
          className="mb-3 border-white/10 bg-black/30 text-sm"
          rows={3}
        />
        <button
          onClick={submitEntry}
          disabled={saving || !composeText.trim()}
          className="flex items-center gap-2 rounded-md border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-2 text-sm font-semibold text-neon-cyan transition-all hover:shadow-glow-cyan disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Log entry
        </button>
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider",
            filter === "all" ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan" : "border-white/10 text-muted-foreground"
          )}
        >
          All Agents
        </button>
        {NAV_AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setFilter(agent.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider",
              filter === agent.id ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan" : "border-white/10 text-muted-foreground"
            )}
          >
            <AgentIcon agentId={agent.id} size={12} />
            {agent.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {!entries &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />)}
        {entries?.length === 0 && (
          <div className="hud-panel flex flex-col items-center gap-3 p-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No journal entries yet.</p>
          </div>
        )}
        {entries?.map((entry) => (
          <JournalEntryCard key={`${entry.agentId}-${entry.date}`} entry={entry} />
        ))}
      </div>
    </motion.div>
  );
}
