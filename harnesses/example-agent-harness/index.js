/**
 * Reference bridge harness.
 *
 * This is a WORKING EXAMPLE of the pattern described in DEPLOY.md: talk to
 * your real agent however it already talks, then publish normalized JSON
 * into Redis in the shape AgentCtrl's live adapter (lib/agents/live.ts)
 * reads, AND poll the chat list to reply to messages sent from the
 * dashboard's Chat page. Swap the simulated bits for real calls into
 * Hermes/Codex/OpenClaw and you have a production bridge.
 *
 * Config via env vars:
 *   REDIS_URL     - defaults to redis://localhost:6379
 *   AGENT_ID      - "hermes" | "codex" | "openclaw" (must match types/agents.ts)
 *   AGENT_NAME    - display name, e.g. "Hermes"
 *   AGENT_TAGLINE - short description shown under the name
 *   TICK_MS       - how often to publish a telemetry update (default 4000)
 *   CHAT_POLL_MS  - how often to check for new chat messages (default 2500)
 */

const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const AGENT_ID = process.env.AGENT_ID || "hermes";
const AGENT_NAME = process.env.AGENT_NAME || "Hermes";
const AGENT_TAGLINE = process.env.AGENT_TAGLINE || "Messenger & orchestration agent";
const TICK_MS = Number(process.env.TICK_MS || 4000);
const CHAT_POLL_MS = Number(process.env.CHAT_POLL_MS || 2500);

const redis = new Redis(REDIS_URL);

const KEY_SUMMARY = `agentctrl:agent:${AGENT_ID}:summary`;
const KEY_TASKS = `agentctrl:agent:${AGENT_ID}:tasks`;
const KEY_LOGS = `agentctrl:agent:${AGENT_ID}:logs`;
const KEY_THROUGHPUT = `agentctrl:agent:${AGENT_ID}:throughput`;
const KEY_ERROR_HISTORY = `agentctrl:agent:${AGENT_ID}:errorHistory`;
const KEY_FLEET_ACTIVITY = "agentctrl:activity";
const KEY_CHAT = `agentctrl:chat:${AGENT_ID}:messages`;

const TASK_TITLES = [
  "Sync knowledge base",
  "Refactor auth module",
  "Summarize inbound alerts",
  "Draft release notes",
  "Index repository changes",
  "Run regression suite",
];

const LOG_MESSAGES = [
  "Heartbeat received",
  "Task dispatched to worker pool",
  "Connected to message bus",
  "Task completed successfully",
  "Config reloaded",
  "Webhook delivered",
];

const CHAT_ACKS = [
  (text) => `Got it — starting on: "${text}"`,
  () => "Acknowledged, queuing that up now.",
  () => "Understood. I'll log progress in the Journal as I go.",
  () => "On it. I'll flag you here if I hit a blocker.",
];

const startedAt = Date.now();
let tasks = seedTasks();
let throughput = seedSeries(20, 100);
let errorHistory = seedSeries(0, 3);
let lastSeenChatLength = null; // set on first poll so we don't reply to history on boot

function rand(min, max) {
  return min + Math.random() * (max - min);
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seedTasks() {
  return Array.from({ length: 6 }).map((_, i) => ({
    id: `task-${AGENT_ID}-${i}`,
    title: pick(TASK_TITLES),
    status: pick(["running", "queued", "completed", "failed"]),
    progress: Math.floor(rand(10, 100)),
    startedAt: new Date().toISOString(),
    etaSeconds: Math.floor(rand(5, 300)),
  }));
}

function seedSeries(min, max) {
  return Array.from({ length: 24 }).map((_, i) => ({ t: `${i}:00`, value: Number(rand(min, max).toFixed(1)) }));
}

async function tick() {
  const now = new Date().toISOString();

  const summary = {
    id: AGENT_ID,
    name: AGENT_NAME,
    tagline: AGENT_TAGLINE,
    health: Math.random() > 0.12 ? "online" : "degraded",
    cpuPct: Math.round(rand(8, 78)),
    memPct: Math.round(rand(15, 70)),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    activeTasks: tasks.filter((t) => t.status === "running").length,
    queuedTasks: tasks.filter((t) => t.status === "queued").length,
    tasksCompletedToday: tasks.filter((t) => t.status === "completed").length + Math.floor(rand(0, 50)),
    tasksFailedToday: tasks.filter((t) => t.status === "failed").length,
    errorRate: Number(rand(0, 3).toFixed(2)),
    lastHeartbeat: now,
  };

  // Nudge a random task forward each tick so the UI feels alive.
  const idx = Math.floor(Math.random() * tasks.length);
  if (tasks[idx].status === "running") {
    tasks[idx].progress = Math.min(100, tasks[idx].progress + Math.floor(rand(5, 20)));
    if (tasks[idx].progress >= 100) tasks[idx].status = "completed";
  } else if (tasks[idx].status === "queued" && Math.random() > 0.6) {
    tasks[idx].status = "running";
  }

  throughput = [...throughput.slice(1), { t: new Date().toLocaleTimeString(), value: Math.round(rand(20, 100)) }];
  errorHistory = [...errorHistory.slice(1), { t: new Date().toLocaleTimeString(), value: Number(rand(0, 3).toFixed(1)) }];

  const logEntry = {
    id: `log-${AGENT_ID}-${Date.now()}`,
    timestamp: now,
    level: Math.random() > 0.85 ? "warn" : Math.random() > 0.95 ? "error" : "info",
    message: pick(LOG_MESSAGES),
  };

  const multi = redis.multi();
  multi.set(KEY_SUMMARY, JSON.stringify(summary));
  multi.set(KEY_TASKS, JSON.stringify(tasks));
  multi.set(KEY_THROUGHPUT, JSON.stringify(throughput));
  multi.set(KEY_ERROR_HISTORY, JSON.stringify(errorHistory));
  multi.lpush(KEY_LOGS, JSON.stringify(logEntry));
  multi.ltrim(KEY_LOGS, 0, 49);

  if (logEntry.level !== "info" || Math.random() > 0.7) {
    const activityEvent = { id: `evt-${AGENT_ID}-${Date.now()}`, agentId: AGENT_ID, message: logEntry.message, timestamp: now, level: logEntry.level };
    multi.lpush(KEY_FLEET_ACTIVITY, JSON.stringify(activityEvent));
    multi.ltrim(KEY_FLEET_ACTIVITY, 0, 99);
  }

  await multi.exec();
  console.log(`[${AGENT_ID}] published tick — health=${summary.health} active=${summary.activeTasks} queued=${summary.queuedTasks}`);
}

/**
 * Polls the shared chat list for new "user" messages and replies with a
 * canned acknowledgement after a short simulated "thinking" delay. A real
 * bridge would replace craftReply()'s body with an actual call into the
 * agent (or an LLM) and could take much longer to reply — that's fine,
 * the dashboard just keeps polling GET /api/chat/<agentId>/messages.
 */
async function respondToChat() {
  const raw = await redis.lrange(KEY_CHAT, 0, -1);

  if (lastSeenChatLength === null) {
    lastSeenChatLength = raw.length; // don't reply to pre-existing history on boot
    return;
  }
  if (raw.length <= lastSeenChatLength) return;

  const newMessages = raw.slice(lastSeenChatLength).map((r) => JSON.parse(r));
  lastSeenChatLength = raw.length;

  for (const msg of newMessages) {
    if (msg.role !== "user") continue;
    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 900));
    const reply = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      agentId: AGENT_ID,
      role: "agent",
      content: pick(CHAT_ACKS)(msg.content),
      createdAt: new Date().toISOString(),
    };
    await redis.rpush(KEY_CHAT, JSON.stringify(reply));
    await redis.ltrim(KEY_CHAT, -500, -1);
    console.log(`[${AGENT_ID}] replied to chat message ${msg.id}`);
  }
}

redis.on("connect", () => console.log(`[${AGENT_ID}] connected to Redis at ${REDIS_URL}`));
redis.on("error", (err) => console.error(`[${AGENT_ID}] redis error:`, err.message));

tick();
setInterval(() => {
  tick().catch((err) => console.error(`[${AGENT_ID}] tick failed:`, err.message));
}, TICK_MS);

setInterval(() => {
  respondToChat().catch((err) => console.error(`[${AGENT_ID}] chat poll failed:`, err.message));
}, CHAT_POLL_MS);
