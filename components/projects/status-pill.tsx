import { cn } from "@/lib/utils";
import { ProjectStatus, TaskPriority, TaskStatus } from "@/types/projects";

const PROJECT_STYLES: Record<ProjectStatus, string> = {
  planning: "border-neon-violet/30 bg-neon-violet/10 text-neon-violet",
  active: "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan",
  blocked: "border-neon-red/30 bg-neon-red/10 text-neon-red",
  completed: "border-neon-green/30 bg-neon-green/10 text-neon-green",
  archived: "border-white/10 bg-white/5 text-muted-foreground",
};

const TASK_STYLES: Record<TaskStatus, string> = {
  inbox: "border-white/10 bg-white/5 text-muted-foreground",
  ready: "border-neon-violet/30 bg-neon-violet/10 text-neon-violet",
  in_progress: "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan",
  in_review: "border-neon-amber/30 bg-neon-amber/10 text-neon-amber",
  awaiting_approval: "border-neon-amber/30 bg-neon-amber/10 text-neon-amber",
  blocked: "border-neon-red/30 bg-neon-red/10 text-neon-red",
  done: "border-neon-green/30 bg-neon-green/10 text-neon-green",
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "border-white/10 bg-white/5 text-muted-foreground",
  medium: "border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan",
  high: "border-neon-amber/30 bg-neon-amber/10 text-neon-amber",
  urgent: "border-neon-red/30 bg-neon-red/10 text-neon-red",
};

const LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  blocked: "Blocked",
  completed: "Completed",
  archived: "Archived",
  inbox: "Inbox",
  ready: "Ready",
  in_progress: "In Progress",
  in_review: "In Review",
  awaiting_approval: "Awaiting Approval",
  done: "Done",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider", PROJECT_STYLES[status])}>
      {LABELS[status]}
    </span>
  );
}

export function TaskStatusPill({ status }: { status: TaskStatus }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider", TASK_STYLES[status])}>
      {LABELS[status]}
    </span>
  );
}

export function TaskPriorityPill({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider", PRIORITY_STYLES[priority])}>
      {LABELS[priority]}
    </span>
  );
}
