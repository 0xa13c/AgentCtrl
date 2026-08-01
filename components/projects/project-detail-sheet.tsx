"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Project, ProjectStatus, TaskStatus } from "@/types/projects";
import { AgentId } from "@/types/agents";
import { ProjectStatusPill, TaskStatusPill } from "@/components/projects/status-pill";
import { AgentAssignChips } from "@/components/projects/agent-assign-chips";

const PROJECT_STATUSES: ProjectStatus[] = ["planning", "active", "blocked", "completed", "archived"];
const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

export function ProjectDetailSheet({
  project,
  open,
  onOpenChange,
  onChanged,
}: {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: (project: Project) => void;
}) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAgents, setNewTaskAgents] = useState<AgentId[]>([]);
  const [addingTask, setAddingTask] = useState(false);

  if (!project) return null;

  async function patchProject(patch: Partial<Pick<Project, "status">>) {
    const res = await fetch(`/api/projects/${project!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) onChanged(await res.json());
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const res = await fetch(`/api/projects/${project!.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle, assignedAgentIds: newTaskAgents }),
      });
      if (res.ok) {
        onChanged(await res.json());
        setNewTaskTitle("");
        setNewTaskAgents([]);
      }
    } finally {
      setAddingTask(false);
    }
  }

  async function patchTask(taskId: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${project!.id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) onChanged(await res.json());
  }

  async function removeTask(taskId: string) {
    const res = await fetch(`/api/projects/${project!.id}/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) onChanged(await res.json());
  }

  function toggleAgentOnTask(taskId: string, agentId: AgentId, current: AgentId[]) {
    const next = current.includes(agentId) ? current.filter((a) => a !== agentId) : [...current, agentId];
    patchTask(taskId, { assignedAgentIds: next });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-neon-cyan/20 bg-void-900 text-foreground sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">{project.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Status</span>
            <Select value={project.status} onValueChange={(v) => patchProject({ status: v as ProjectStatus })}>
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

          {project.goal && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Goal</p>
              <p className="mt-1 text-sm text-foreground">{project.goal}</p>
            </div>
          )}
          {project.description && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Description</p>
              <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            </div>
          )}

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Tasks ({project.tasks.filter((t) => t.status === "done").length}/{project.tasks.length})
            </p>

            <div className="mb-4 flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-black/20 p-3">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="New task title..."
                className="border-white/10 bg-black/30 text-sm"
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <div className="flex items-center justify-between gap-2">
                <AgentAssignChips selected={newTaskAgents} onToggle={(id) => setNewTaskAgents((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))} />
                <button
                  onClick={addTask}
                  disabled={addingTask || !newTaskTitle.trim()}
                  className="flex shrink-0 items-center gap-1.5 rounded-md border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-neon-cyan transition-all hover:shadow-glow-cyan disabled:opacity-50"
                >
                  {addingTask ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {project.tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
              {project.tasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground">{task.title}</p>
                    <button onClick={() => removeTask(task.id)} className="shrink-0 text-muted-foreground hover:text-neon-red">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <AgentAssignChips selected={task.assignedAgentIds} onToggle={(id) => toggleAgentOnTask(task.id, id, task.assignedAgentIds)} />
                    <div className="flex items-center gap-2">
                      <TaskStatusPill status={task.status} />
                      <Select value={task.status} onValueChange={(v) => patchTask(task.id, { status: v as TaskStatus })}>
                        <SelectTrigger className="h-7 w-32 border-white/10 bg-black/30 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
