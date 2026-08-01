import { AgentId } from "./agents";

export type ProjectStatus = "planning" | "active" | "blocked" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
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
  createdAt: string;
  updatedAt: string;
  tasks: ProjectTask[];
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  goal?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignedAgentIds?: AgentId[];
}
