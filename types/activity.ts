import { AgentId, LogLevel } from "./agents";

export type ActivitySource = "project" | "journal" | "chat";

export interface PlatformActivityEvent {
  id: string;
  source: ActivitySource;
  message: string;
  level: LogLevel;
  agentId?: AgentId;
  projectId?: string;
  timestamp: string;
}
