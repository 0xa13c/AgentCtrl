export type AgentId = "hermes" | "codex" | "openclaw";

export type AgentHealth = "online" | "degraded" | "offline" | "paused";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface AgentSummary {
  id: AgentId;
  name: string;
  tagline: string;
  health: AgentHealth;
  cpuPct: number;
  memPct: number;
  uptimeSeconds: number;
  activeTasks: number;
  queuedTasks: number;
  tasksCompletedToday: number;
  tasksFailedToday: number;
  errorRate: number;
  lastHeartbeat: string;
}

export interface AgentTask {
  id: string;
  title: string;
  status: "running" | "queued" | "completed" | "failed";
  progress: number;
  startedAt: string;
  etaSeconds: number | null;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}

export interface MetricPoint {
  t: string;
  value: number;
}

export interface FleetActivityEvent {
  id: string;
  agentId: AgentId;
  message: string;
  timestamp: string;
  level: LogLevel;
}

export interface AgentDetail extends AgentSummary {
  tasks: AgentTask[];
  logs: LogEntry[];
  throughput: MetricPoint[];
  errorHistory: MetricPoint[];
}
