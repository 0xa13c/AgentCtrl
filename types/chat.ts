import { AgentId } from "./agents";

export type ChatRole = "user" | "agent";

export interface ChatMessage {
  id: string;
  agentId: AgentId;
  role: ChatRole;
  content: string;
  projectId?: string;
  taskId?: string;
  createdAt: string;
}

export interface SendMessageInput {
  content: string;
  projectId?: string;
  /** If true (and projectId is set), also creates a task in that project assigned to this agent. */
  createTask?: boolean;
}
