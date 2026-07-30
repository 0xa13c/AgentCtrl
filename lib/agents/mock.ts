import {
  AgentDetail,
  AgentId,
  AgentSummary,
  AgentTask,
  FleetActivityEvent,
  LogEntry,
  MetricPoint,
} from "@/types/agents";
import { AgentAdapter } from "./adapter";

const AGENT_META: Record<AgentId, { name: string; tagline: string }> = {
  hermes: { name: "Hermes", tagline: "Messenger & orchestration agent" },
  codex: { name: "Codex", tagline: "Autonomous coding agent" },
  openclaw: { name: "OpenClaw", tagline: "Task execution & tooling agent" },
};

let seed = 42;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function randRange(min: number, max: number) {
  return min + rand() * (max - min);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

const TASK_TITLES = [
  "Sync knowledge base",
  "Refactor auth module",
  "Summarize inbound alerts",
  "Draft release notes",
  "Index repository changes",
  "Run regression suite",
  "Deploy staging build",
  "Classify support tickets",
  "Generate weekly digest",
  "Reconcile task queue",
];

const LOG_MESSAGES = [
  "Heartbeat received",
  "Task dispatched to worker pool",
  "Cache warm complete",
  "Retrying transient network error",
  "Connected to message bus",
  "Task completed successfully",
  "Rate limit approaching threshold",
  "Config reloaded",
  "Webhook delivered",
  "Memory checkpoint saved",
];

function buildTasks(count: number): AgentTask[] {
  return Array.from({ length: count }).map((_, i) => {
    const status = pick(["running", "queued", "completed", "failed"] as const);
    return {
      id: `task-${i}-${Math.floor(rand() * 100000)}`,
      title: pick(TASK_TITLES),
      status,
      progress: status === "completed" ? 100 : status === "failed" ? Math.floor(randRange(10, 90)) : Math.floor(randRange(5, 95)),
      startedAt: new Date(Date.now() - randRange(0, 3600_000)).toISOString(),
      etaSeconds: status === "running" ? Math.floor(randRange(5, 600)) : null,
    };
  });
}

function buildLogs(count: number): LogEntry[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `log-${i}-${Math.floor(rand() * 100000)}`,
    timestamp: new Date(Date.now() - i * randRange(2000, 20000)).toISOString(),
    level: pick(["info", "info", "info", "warn", "debug", "error"] as const),
    message: pick(LOG_MESSAGES),
  }));
}

function buildThroughput(): MetricPoint[] {
  return Array.from({ length: 24 }).map((_, i) => ({
    t: `${i}:00`,
    value: Math.round(randRange(20, 100)),
  }));
}

function buildErrorHistory(): MetricPoint[] {
  return Array.from({ length: 24 }).map((_, i) => ({
    t: `${i}:00`,
    value: Number(randRange(0, 5).toFixed(1)),
  }));
}

function buildSummary(id: AgentId): AgentSummary {
  const meta = AGENT_META[id];
  const health = pick(["online", "online", "online", "degraded"] as const);
  return {
    id,
    name: meta.name,
    tagline: meta.tagline,
    health,
    cpuPct: Math.round(randRange(8, 78)),
    memPct: Math.round(randRange(15, 70)),
    uptimeSeconds: Math.round(randRange(3600, 500_000)),
    activeTasks: Math.round(randRange(0, 6)),
    queuedTasks: Math.round(randRange(0, 12)),
    tasksCompletedToday: Math.round(randRange(20, 400)),
    tasksFailedToday: Math.round(randRange(0, 15)),
    errorRate: Number(randRange(0, 4).toFixed(2)),
    lastHeartbeat: new Date(Date.now() - randRange(0, 15000)).toISOString(),
  };
}

export const mockAdapter: AgentAdapter = {
  async listAgents() {
    await delay();
    return (Object.keys(AGENT_META) as AgentId[]).map(buildSummary);
  },

  async getAgent(id: AgentId) {
    await delay();
    const summary = buildSummary(id);
    return {
      ...summary,
      tasks: buildTasks(8),
      logs: buildLogs(30),
      throughput: buildThroughput(),
      errorHistory: buildErrorHistory(),
    };
  },

  async getFleetActivity(limit = 20) {
    await delay();
    const ids: AgentId[] = ["hermes", "codex", "openclaw"];
    return Array.from({ length: limit }).map((_, i) => ({
      id: `evt-${i}-${Math.floor(rand() * 100000)}`,
      agentId: pick(ids),
      message: pick(LOG_MESSAGES),
      timestamp: new Date(Date.now() - i * randRange(3000, 40000)).toISOString(),
      level: pick(["info", "info", "warn", "error"] as const),
    }));
  },

  async sendCommand(id: AgentId, command) {
    await delay(300);
    return { ok: true };
  },
};

function delay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
