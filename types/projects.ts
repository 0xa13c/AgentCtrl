import { AgentId } from "./agents";

export type ProjectStatus = "planning" | "active" | "blocked" | "completed" | "archived";

/**
 * Default Kanban columns, in board order. Matches the "Inbox → Ready →
 * In Progress → In Review → Awaiting Approval → Blocked → Done" pipeline
 * from the mission-control spec — gives real operational signal (what's
 * unstarted vs. what's stuck waiting on a human) instead of a flat todo list.
 */
export type TaskStatus = "inbox" | "ready" | "in_progress" | "in_review" | "awaiting_approval" | "blocked" | "done";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentIds: AgentId[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  goal: string;
  status: ProjectStatus;
  repoUrl?: string;
  environment?: string;
  budgetCap?: number;
  createdAt: string;
  updatedAt: string;
  tasks: ProjectTask[];
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  goal?: string;
  repoUrl?: string;
  environment?: string;
  budgetCap?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedAgentIds?: AgentId[];
}

export const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "inbox", label: "Inbox" },
  { status: "ready", label: "Ready" },
  { status: "in_progress", label: "In Progress" },
  { status: "in_review", label: "In Review" },
  { status: "awaiting_approval", label: "Awaiting Approval" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
];
