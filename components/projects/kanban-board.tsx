"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Trash2, GripVertical } from "lucide-react";
import { ProjectTask, TASK_COLUMNS, TaskStatus } from "@/types/projects";
import { AgentId } from "@/types/agents";
import { TaskPriorityPill } from "@/components/projects/status-pill";
import { AgentAssignChips } from "@/components/projects/agent-assign-chips";
import { cn } from "@/lib/utils";

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  inbox: "border-t-white/20",
  ready: "border-t-neon-violet/50",
  in_progress: "border-t-neon-cyan/50",
  in_review: "border-t-neon-amber/50",
  awaiting_approval: "border-t-neon-amber/50",
  blocked: "border-t-neon-red/50",
  done: "border-t-neon-green/50",
};

function TaskCard({
  task,
  onToggleAgent,
  onDelete,
}: {
  task: ProjectTask;
  onToggleAgent: (agentId: AgentId) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        "group rounded-xl border border-white/[0.06] bg-black/30 p-3 transition-shadow",
        isDragging && "opacity-40"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5">
          <button {...attributes} {...listeners} className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <p className="text-sm text-foreground">{task.title}</p>
        </div>
        <button onClick={onDelete} className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-neon-red group-hover:opacity-100">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <AgentAssignChips selected={task.assignedAgentIds} onToggle={onToggleAgent} />
        <TaskPriorityPill priority={task.priority} />
      </div>
    </div>
  );
}

function Column({
  status,
  label,
  tasks,
  onToggleAgent,
  onDelete,
}: {
  status: TaskStatus;
  label: string;
  tasks: ProjectTask[];
  onToggleAgent: (taskId: string, agentId: AgentId) => void;
  onDelete: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-2xl border border-t-2 border-white/[0.06] bg-void-900/40 p-3 transition-colors",
        COLUMN_ACCENT[status],
        isOver && "bg-white/[0.03]"
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="scrollbar-hud flex-1 space-y-2 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onToggleAgent={(a) => onToggleAgent(task.id, a)} onDelete={() => onDelete(task.id)} />
        ))}
        {tasks.length === 0 && <div className="rounded-xl border border-dashed border-white/[0.06] p-4 text-center text-xs text-muted-foreground">Drop here</div>}
      </div>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  onMove,
  onToggleAgent,
  onDelete,
}: {
  tasks: ProjectTask[];
  onMove: (taskId: string, status: TaskStatus) => void;
  onToggleAgent: (taskId: string, agentId: AgentId) => void;
  onDelete: (taskId: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    const newStatus = over.id as TaskStatus;
    if (task && task.status !== newStatus) {
      onMove(task.id, newStatus);
    }
  }

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="scrollbar-hud flex gap-4 overflow-x-auto pb-2">
        {TASK_COLUMNS.map((col) => (
          <Column
            key={col.status}
            status={col.status}
            label={col.label}
            tasks={tasks.filter((t) => t.status === col.status)}
            onToggleAgent={onToggleAgent}
            onDelete={onDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-72 rounded-xl border border-neon-cyan/40 bg-void-900 p-3 shadow-glow-cyan">
            <p className="text-sm text-foreground">{activeTask.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
