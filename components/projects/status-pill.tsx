import { cn } from "@/lib/utils";
import { ProjectStatus, TaskStatus } from "@/types/projects";

const PROJECT_STYLES: Record<ProjectStatus, string> = {
  planning: "border-neon-violet/30 bg-neon-violet/10 text-neon-violet",
  active: "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan",
  blocked: "border-neon-red/30 bg-neon-red/10 text-neon-red",
  completed: "border-neon-green/30 bg-neon-green/10 text-neon-green",
  archived: "border-white/10 bg-white/5 text-muted-foreground",
};

const TASK_STYLES: Record<TaskStatus, string> = {
  todo: "border-white/10 bg-white/5 text-muted-foreground",
  in_progress: "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan",
  blocked: "border-neon-red/30 bg-neon-red/10 text-neon-red",
  done: "border-neon-green/30 bg-neon-green/10 text-neon-green",
};

const LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  blocked: "Blocked",
  completed: "Completed",
  archived: "Archived",
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
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
