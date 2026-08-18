"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, Link2, Server, Wallet } from "lucide-react";
import { Project, ProjectStatus, TaskPriority } from "@/types/projects";
import { AgentId } from "@/types/agents";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectStatusPill } from "@/components/projects/status-pill";
import { AgentAssignChips } from "@/components/projects/agent-assign-chips";
import { KanbanBoard } from "@/components/projects/kanban-board";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const PROJECT_STATUSES: ProjectStatus[] = ["planning", "active", "blocked", "completed", "archived"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAgents, setNewTaskAgents] = useState<AgentId[]>([]);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");
  const [addingTask, setAddingTask] = useState(false);

  function load() {
    fetch(`/api/projects/${projectId}`).then((res) => {
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      res.json().then(setProject);
    });
  }

  useEffect(load, [projectId]);

  const patchProjectDebounced = useDebouncedCallback(async (patch: Record<string, unknown>) => {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }, 600);

  async function patchProjectNow(patch: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) setProject(await res.json());
  }

  function updateField(patch: Partial<Project>) {
    setProject((prev) => (prev ? { ...prev, ...patch } : prev));
    patchProjectDebounced(patch);
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle, assignedAgentIds: newTaskAgents, priority: newTaskPriority }),
      });
      if (res.ok) {
        setProject(await res.json());
        setNewTaskTitle("");
        setNewTaskAgents([]);
        setNewTaskPriority("medium");
      }
    } finally {
      setAddingTask(false);
    }
  }

  async function moveTask(taskId: string, status: string) {
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setProject(await res.json());
  }

  async function toggleAgentOnTask(taskId: string, agentId: AgentId) {
    if (!project) return;
    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const next = task.assignedAgentIds.includes(agentId) ? task.assignedAgentIds.filter((a) => a !== agentId) : [...task.assignedAgentIds, agentId];
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedAgentIds: next }),
    });
    if (res.ok) setProject(await res.json());
  }

  async function deleteTask(taskId: string) {
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) setProject(await res.json());
  }

  if (notFound) {
    return (
      <div className="hud-panel p-8 text-center">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Link href="/projects" className="mt-2 inline-block text-sm text-neon-cyan hover:underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl bg-white/5" />
        <Skeleton className="h-96 rounded-2xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects
      </Link>

      <div className="hud-panel p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Input
              value={project.name}
              onChange={(e) => updateField({ name: e.target.value })}
              className="mb-2 border-none bg-transparent px-0 font-display text-2xl font-black text-foreground focus-visible:ring-0"
            />
            <Input
              value={project.goal}
              onChange={(e) => updateField({ goal: e.target.value })}
              placeholder="What does done look like?"
              className="border-none bg-transparent px-0 text-sm text-muted-foreground focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={project.status} onValueChange={(v) => patchProjectNow({ status: v })}>
              <SelectTrigger className="w-40 border-white/10 bg-black/30 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ProjectStatusPill status={project.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <Input
              value={project.repoUrl ?? ""}
              onChange={(e) => updateField({ repoUrl: e.target.value })}
              placeholder="Repository URL"
              className="h-7 border-none bg-transparent px-0 text-xs focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
            <Server className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <Input
              value={project.environment ?? ""}
              onChange={(e) => updateField({ environment: e.target.value })}
              placeholder="Environment (e.g. OCI VPS / prod)"
              className="h-7 border-none bg-transparent px-0 text-xs focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
            <Wallet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <Input
              type="number"
              value={project.budgetCap ?? ""}
              onChange={(e) => updateField({ budgetCap: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Budget cap ($)"
              className="h-7 border-none bg-transparent px-0 text-xs focus-visible:ring-0"
            />
          </div>
        </div>
      </div>

      <div className="hud-panel p-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Add a task</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="New task title..."
            className="flex-1 border-white/10 bg-black/30 text-sm"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as TaskPriority)}>
            <SelectTrigger className="w-32 border-white/10 bg-black/30 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AgentAssignChips selected={newTaskAgents} onToggle={(id) => setNewTaskAgents((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))} />
          <button
            onClick={addTask}
            disabled={addingTask || !newTaskTitle.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-neon-cyan transition-all hover:shadow-glow-cyan disabled:opacity-50"
          >
            {addingTask ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add
          </button>
        </div>
      </div>

      <KanbanBoard tasks={project.tasks} onMove={moveTask} onToggleAgent={toggleAgentOnTask} onDelete={deleteTask} />
    </div>
  );
}
