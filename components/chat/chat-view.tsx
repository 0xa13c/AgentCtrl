"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, FolderKanban } from "lucide-react";
import { AgentId } from "@/types/agents";
import { ChatMessage } from "@/types/chat";
import { Project } from "@/types/projects";
import { NAV_AGENTS } from "@/lib/constants";
import { AgentIcon } from "@/components/hud/agent-icon";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const AGENT_TAB_STYLE: Record<AgentId, string> = {
  hermes: "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan shadow-glow-cyan",
  codex: "border-neon-violet/50 bg-neon-violet/10 text-neon-violet shadow-glow-violet",
  openclaw: "border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta shadow-glow-magenta",
};

export function ChatView() {
  const [activeAgent, setActiveAgent] = useState<AgentId>("hermes");
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("none");
  const [createTask, setCreateTask] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then(setProjects);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMessages(null);

    async function poll() {
      const res = await fetch(`/api/chat/${activeAgent}/messages`);
      const data = await res.json();
      if (!cancelled) setMessages(data);
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeAgent]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${activeAgent}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: draft,
          projectId: projectId === "none" ? undefined : projectId,
          createTask: createTask && projectId !== "none",
        }),
      });
      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...(prev ?? []), message]);
        setDraft("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col gap-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">command line</p>
        <h1 className="font-display text-2xl font-black tracking-wide text-foreground">CHAT</h1>
        <p className="mt-1 text-sm text-muted-foreground">Talk directly to an agent and optionally spin the message into a project task.</p>
      </div>

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

      <div className="hud-panel flex flex-1 flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="scrollbar-hud flex-1 space-y-4 overflow-y-auto p-5">
          {!messages && <p className="text-sm text-muted-foreground">Loading conversation...</p>}
          {messages?.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <AgentIcon agentId={activeAgent} size={28} />
              <p className="text-sm">No messages with this agent yet. Say hello.</p>
            </div>
          )}
          {messages?.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>

        <div className="border-t border-white/[0.06] p-4">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FolderKanban className="h-3.5 w-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-wider">Link to project</span>
            </div>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-8 w-56 border-white/10 bg-black/30 text-xs">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {projectId !== "none" && (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Checkbox checked={createTask} onCheckedChange={(v) => setCreateTask(Boolean(v))} />
                Create a task from this message
              </label>
            )}
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Message ${activeAgent}...`}
              className="min-h-[44px] flex-1 resize-none border-white/10 bg-black/30 text-sm"
              rows={1}
            />
            <button
              onClick={send}
              disabled={sending || !draft.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan transition-all hover:shadow-glow-cyan disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
