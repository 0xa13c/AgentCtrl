/**
 * Real bridge between a running Hermes Agent and AgentCtrl's Redis contract.
 *
 * Unlike harnesses/example-agent-harness (which fakes everything), this
 * talks to Hermes's actual OpenAI-compatible API server
 * (https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server)
 * and writes REAL data into the exact same Redis keys the dashboard already
 * reads. Nothing in the Next.js app changes.
 *
 * Config via env vars:
 *   REDIS_URL          - defaults to redis://localhost:6379
 *   HERMES_API_URL     - base URL of Hermes's API server, e.g.
 *                        http://hermes:8642 if Hermes joins this compose
 *                        network, or http://<host>:8642 otherwise.
 *   HERMES_API_KEY     - the API_SERVER_KEY you set in Hermes's ~/.hermes/.env
 *   HERMES_SESSION_ID  - stable session id so Hermes keeps real conversation
 *                        context across AgentCtrl chat messages
 *                        (default: "agentctrl-chat-hermes")
 *   AGENT_ID           - always "hermes" for this bridge
 *   HEALTH_POLL_MS     - how often to poll Hermes health (default 10000)
 *   CHAT_POLL_MS       - how often to check for new chat/terminal input
 *                        (default 2000)
 *   PRICING_REFRESH_MS - how often to refresh the pricing table from
 *                        /api/model/options (default 1800000 = 30min)
 *   HERMES_AUTO_JOURNAL - "true" (default) to auto-log a one-line Journal
 *                        entry after each completed run
 *
 * If HERMES_API_URL is unset, this process idles and logs a reminder
 * instead of crash-looping, so it's safe to leave in docker-compose before
 * you've actually configured Hermes.
 */

const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const AGENT_ID = "hermes";
const HERMES_API_URL = process.env.HERMES_API_URL || "";
const HERMES_API_KEY = process.env.HERMES_API_KEY || "";
const HERMES_SESSION_ID = process.env.HERMES_SESSION_ID || "agentctrl-chat-hermes";
const HEALTH_POLL_MS = Number(process.env.HEALTH_POLL_MS || 10000);
const CHAT_POLL_MS = Number(process.env.CHAT_POLL_MS || 2000);
const PRICING_REFRESH_MS = Number(process.env.PRICING_REFRESH_MS || 1800000);
const AUTO_JOURNAL = process.env.HERMES_AUTO_JOURNAL !== "false";

const redis = new Redis(REDIS_URL);

const KEY_SUMMARY = `agentctrl:agent:${AGENT_ID}:summary`;
const KEY_TASKS = `agentctrl:agent:${AGENT_ID}:tasks`;
const KEY_LOGS = `agentctrl:agent:${AGENT_ID}:logs`;
const KEY_THROUGHPUT = `agentctrl:agent:${AGENT_ID}:throughput`;
const KEY_ERROR_HISTORY = `agentctrl:agent:${AGENT_ID}:errorHistory`;
const KEY_FLEET_ACTIVITY = "agentctrl:activity";
const KEY_CHAT = `agentctrl:chat:${AGENT_ID}:messages`;
const KEY_TERMINAL_OUTPUT = `agentctrl:terminal:${AGENT_ID}:output`;
const KEY_TERMINAL_INPUT = `agentctrl:terminal:${AGENT_ID}:input`;
const KEY_USAGE_DAILY = `agentctrl:usage:${AGENT_ID}:daily`;
const KEY_USAGE_EVENTS = "agentctrl:usage:events";
const KEY_JOURNAL = `agentctrl:journal:${AGENT_ID}`;

function hermesHeaders(extra = {}) {
  return { Authorization: `Bearer ${HERMES_API_KEY}`, "Content-Type": "application/json", ...extra };
}

async function hermesFetch(path, options = {}) {
  const res = await fetch(`${HERMES_API_URL}${path}`, { ...options, headers: hermesHeaders(options.headers) });
  return res;
}

// ---------------------------------------------------------------------------
// Health -> agentctrl:agent:hermes:summary
// ---------------------------------------------------------------------------

const startedAt = Date.now();
const localTasks = new Map(); // runId -> { id, title, status, progress, startedAt, etaSeconds }
let tasksCompletedToday = 0;
let tasksFailedToday = 0;
let lastErrorRate = 0;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function taskListForRedis() {
  return Array.from(localTasks.values()).slice(-20);
}

async function pollHealth() {
  let health = "offline";
  try {
    const res = await hermesFetch("/health");
    if (res.ok) {
      const detailedRes = await hermesFetch("/health/detailed");
      health = res.ok ? "online" : "degraded";
      if (detailedRes.ok) {
        const detailed = await detailedRes.json().catch(() => null);
        if (detailed?.status && detailed.status !== "ok" && detailed.status !== "healthy") {
          health = "degraded";
        }
      }
    }
  } catch (err) {
    health = "offline";
    console.error(`[hermes-bridge] health check failed:`, err.message);
  }

  const summary = {
    id: AGENT_ID,
    name: "Hermes",
    tagline: "Messenger & orchestration agent",
    health,
    cpuPct: 0, // Hermes's API doesn't expose host CPU/mem; wire up `docker stats` separately if you want this populated
    memPct: 0,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    activeTasks: Array.from(localTasks.values()).filter((t) => t.status === "running").length,
    queuedTasks: 0,
    tasksCompletedToday,
    tasksFailedToday,
    errorRate: lastErrorRate,
    lastHeartbeat: new Date().toISOString(),
  };

  await redis.set(KEY_SUMMARY, JSON.stringify(summary));
  await redis.set(KEY_TASKS, JSON.stringify(taskListForRedis()));
  console.log(`[hermes-bridge] health=${health} activeTasks=${summary.activeTasks}`);
}

// ---------------------------------------------------------------------------
// Pricing -> GET /api/model/options (best-effort; field names are not fully
// documented, so this degrades to $0 cost rather than guessing wrong)
// ---------------------------------------------------------------------------

let pricingTable = new Map(); // `${provider}:${model}` -> { inputPer1k, outputPer1k }

function extractPrice(entry) {
  // Defensive extraction — adjust these candidate field names once you've
  // seen a real /api/model/options response for your Hermes version.
  const input =
    entry?.pricing?.input_per_1k ?? entry?.pricing?.input ?? entry?.input_price_per_1k ?? entry?.input_cost_per_1k_tokens ?? null;
  const output =
    entry?.pricing?.output_per_1k ?? entry?.pricing?.output ?? entry?.output_price_per_1k ?? entry?.output_cost_per_1k_tokens ?? null;
  if (input == null && output == null) return null;
  return { inputPer1k: Number(input) || 0, outputPer1k: Number(output) || 0 };
}

async function refreshPricing() {
  try {
    const res = await hermesFetch("/api/model/options");
    if (!res.ok) return;
    const data = await res.json();
    const rows = Array.isArray(data) ? data : data.models || data.providers || [];
    const next = new Map();
    for (const row of rows) {
      const price = extractPrice(row);
      if (!price) continue;
      const provider = row.provider || row.provider_id || "unknown";
      const model = row.model || row.id || row.name;
      if (model) next.set(`${provider}:${model}`, price);
    }
    if (next.size > 0) {
      pricingTable = next;
      console.log(`[hermes-bridge] refreshed pricing table (${next.size} model entries)`);
    } else {
      console.warn("[hermes-bridge] /api/model/options didn't match expected pricing fields — costUsd will report as 0 until this is adjusted");
    }
  } catch (err) {
    console.error("[hermes-bridge] pricing refresh failed:", err.message);
  }
}

function computeCost(runtime, usage) {
  if (!runtime || !usage) return 0;
  const key = `${runtime.provider}:${runtime.model}`;
  const price = pricingTable.get(key);
  if (!price) return 0;
  const inputCost = ((usage.input_tokens || 0) / 1000) * price.inputPer1k;
  const outputCost = ((usage.output_tokens || 0) / 1000) * price.outputPer1k;
  return Number((inputCost + outputCost).toFixed(6));
}

// ---------------------------------------------------------------------------
// Usage reporting -> same Redis shape as lib/usage/store.ts
// ---------------------------------------------------------------------------

async function reportUsage(usage, runtime) {
  const date = today();
  const tokensIn = usage?.input_tokens || 0;
  const tokensOut = usage?.output_tokens || 0;
  const costUsd = computeCost(runtime, usage);

  const existingRaw = await redis.hget(KEY_USAGE_DAILY, date);
  const existing = existingRaw ? JSON.parse(existingRaw) : { date, tokensIn: 0, tokensOut: 0, costUsd: 0 };
  const updated = {
    date,
    tokensIn: existing.tokensIn + tokensIn,
    tokensOut: existing.tokensOut + tokensOut,
    costUsd: Number((existing.costUsd + costUsd).toFixed(4)),
  };
  await redis.hset(KEY_USAGE_DAILY, date, JSON.stringify(updated));

  const event = { id: `usage-hermes-${Date.now()}`, agentId: AGENT_ID, tokensIn, tokensOut, costUsd, timestamp: new Date().toISOString() };
  await redis.lpush(KEY_USAGE_EVENTS, JSON.stringify(event));
  await redis.ltrim(KEY_USAGE_EVENTS, 0, 499);
}

// ---------------------------------------------------------------------------
// Terminal output helpers
// ---------------------------------------------------------------------------

async function writeTerminalLine(line) {
  await redis.rpush(KEY_TERMINAL_OUTPUT, line.endsWith("\n") ? line : `${line}\r\n`);
  await redis.ltrim(KEY_TERMINAL_OUTPUT, -5000, -1);
}

async function appendLog(level, message) {
  const entry = { id: `log-hermes-${Date.now()}`, timestamp: new Date().toISOString(), level, message };
  await redis.lpush(KEY_LOGS, JSON.stringify(entry));
  await redis.ltrim(KEY_LOGS, 0, 49);
  if (level !== "info") {
    const activityEvent = { id: `evt-hermes-${Date.now()}`, agentId: AGENT_ID, message, timestamp: entry.timestamp, level };
    await redis.lpush(KEY_FLEET_ACTIVITY, JSON.stringify(activityEvent));
    await redis.ltrim(KEY_FLEET_ACTIVITY, 0, 99);
  }
}

async function appendJournalLine(summary) {
  if (!AUTO_JOURNAL) return;
  const date = today();
  const now = new Date().toISOString();
  const existingRaw = await redis.hget(KEY_JOURNAL, date);
  const existing = existingRaw ? JSON.parse(existingRaw) : null;
  const timestamp = now.slice(11, 16);
  const content = existing ? `${existing.content}\n\n[${timestamp}] ${summary}` : summary;
  const entry = { agentId: AGENT_ID, date, content, createdAt: existing?.createdAt ?? now, updatedAt: now };
  await redis.hset(KEY_JOURNAL, date, JSON.stringify(entry));
}

// ---------------------------------------------------------------------------
// SSE parsing (no extra dependency — Node's native fetch gives a web
// ReadableStream we can read manually)
// ---------------------------------------------------------------------------

async function* parseSSE(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      let eventName = "message";
      const dataLines = [];
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith(":")) continue; // keepalive comment
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length === 0) continue;
      const raw = dataLines.join("\n");
      try {
        yield { event: eventName, data: JSON.parse(raw) };
      } catch {
        yield { event: eventName, data: raw };
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Running a Hermes turn: POST /v1/runs, stream events, resolve to a chat
// reply + terminal activity + usage. Shared by both chat messages and
// interactive terminal input.
// ---------------------------------------------------------------------------

async function runHermesTurn(input, { idempotencyKey, source } = {}) {
  const task = {
    id: `pending-${Date.now()}`,
    title: input.length > 60 ? `${input.slice(0, 57)}...` : input,
    status: "running",
    progress: 10,
    startedAt: new Date().toISOString(),
    etaSeconds: null,
  };
  localTasks.set(task.id, task);
  await redis.set(KEY_TASKS, JSON.stringify(taskListForRedis()));

  let runId = null;
  try {
    const createRes = await hermesFetch("/v1/runs", {
      method: "POST",
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
      body: JSON.stringify({ input, session_id: HERMES_SESSION_ID }),
    });
    if (!createRes.ok) {
      throw new Error(`POST /v1/runs failed: ${createRes.status} ${await createRes.text().catch(() => "")}`);
    }
    const created = await createRes.json();
    runId = created.run_id;
    localTasks.delete(task.id);
    task.id = runId;
    localTasks.set(runId, task);

    if (source === "terminal") await writeTerminalLine(`\x1b[95m$ ${input}\x1b[0m`);

    const eventsRes = await hermesFetch(`/v1/runs/${runId}/events`, { headers: { Accept: "text/event-stream" } });
    if (!eventsRes.ok || !eventsRes.body) {
      throw new Error(`GET /v1/runs/${runId}/events failed: ${eventsRes.status}`);
    }

    let finalOutput = "";
    let finalUsage = null;
    let finalRuntime = null;
    let failed = false;

    for await (const { event, data } of parseSSE(eventsRes)) {
      if (event === "tool.started" && data?.tool) {
        await writeTerminalLine(`\x1b[36m▶ ${data.tool}\x1b[0m ${data.preview ? JSON.stringify(data.preview).slice(0, 200) : ""}`);
      } else if (event === "tool.completed" && data?.tool) {
        const color = data.error ? "\x1b[31m✗" : "\x1b[32m✓";
        await writeTerminalLine(`${color} ${data.tool}\x1b[0m (${data.duration ?? "?"}s) ${data.preview ? String(data.preview).slice(0, 200) : ""}`);
      } else if (event === "approval.request") {
        await writeTerminalLine(`\x1b[33m⚠ approval requested — resolve via Hermes directly (not yet wired into AgentCtrl Approvals)\x1b[0m`);
        await appendLog("warn", "Hermes run is waiting on an approval decision");
      } else if (event === "run.completed") {
        finalOutput = data?.output ?? "";
        finalUsage = data?.usage ?? null;
        finalRuntime = data?.runtime ?? null;
      } else if (event === "run.failed" || event === "run.cancelled" || event === "run.interrupted") {
        failed = true;
        finalOutput = data?.error || `Run ended: ${event}`;
      }
    }

    localTasks.delete(runId);

    if (failed) {
      tasksFailedToday++;
      await appendLog("error", `Run ${runId} failed: ${finalOutput}`);
      if (source === "terminal") await writeTerminalLine(`\x1b[31m${finalOutput}\x1b[0m`);
      else await redis.rpush(KEY_CHAT, JSON.stringify({ id: `msg-${Date.now()}`, agentId: AGENT_ID, role: "agent", content: `⚠ ${finalOutput}`, createdAt: new Date().toISOString() }));
      return;
    }

    tasksCompletedToday++;
    if (finalUsage) await reportUsage(finalUsage, finalRuntime);

    if (source === "terminal") {
      await writeTerminalLine(`\x1b[90m${finalOutput}\x1b[0m`);
    } else {
      await redis.rpush(KEY_CHAT, JSON.stringify({ id: `msg-${Date.now()}`, agentId: AGENT_ID, role: "agent", content: finalOutput, createdAt: new Date().toISOString() }));
      await redis.ltrim(KEY_CHAT, -500, -1);
    }

    if (finalOutput) await appendJournalLine(`Handled: "${task.title}"`);
  } catch (err) {
    console.error("[hermes-bridge] run failed:", err.message);
    tasksFailedToday++;
    localTasks.delete(runId || task.id);
    await appendLog("error", `Bridge error: ${err.message}`);
    if (source === "terminal") await writeTerminalLine(`\x1b[31m(bridge error) ${err.message}\x1b[0m`);
  } finally {
    await redis.set(KEY_TASKS, JSON.stringify(taskListForRedis()));
  }
}

// ---------------------------------------------------------------------------
// Poll loops for chat + terminal input
// ---------------------------------------------------------------------------

let lastSeenChatLength = null;
async function pollChat() {
  const raw = await redis.lrange(KEY_CHAT, 0, -1);
  if (lastSeenChatLength === null) {
    lastSeenChatLength = raw.length;
    return;
  }
  if (raw.length <= lastSeenChatLength) return;
  const newMessages = raw.slice(lastSeenChatLength).map((r) => JSON.parse(r));
  lastSeenChatLength = raw.length;

  for (const msg of newMessages) {
    if (msg.role !== "user") continue;
    runHermesTurn(msg.content, { idempotencyKey: msg.id, source: "chat" }).catch((e) => console.error("[hermes-bridge] chat turn failed:", e.message));
  }
}

let lastSeenTerminalInputLength = null;
async function pollTerminalInput() {
  const raw = await redis.lrange(KEY_TERMINAL_INPUT, 0, -1);
  if (lastSeenTerminalInputLength === null) {
    lastSeenTerminalInputLength = raw.length;
    return;
  }
  if (raw.length <= lastSeenTerminalInputLength) return;
  const newCommands = raw.slice(lastSeenTerminalInputLength).map((r) => JSON.parse(r));
  lastSeenTerminalInputLength = raw.length;

  for (const { command } of newCommands) {
    runHermesTurn(command, { idempotencyKey: `term-${Date.now()}`, source: "terminal" }).catch((e) => console.error("[hermes-bridge] terminal turn failed:", e.message));
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

redis.on("connect", () => console.log(`[hermes-bridge] connected to Redis at ${REDIS_URL}`));
redis.on("error", (err) => console.error("[hermes-bridge] redis error:", err.message));

if (!HERMES_API_URL) {
  console.log("[hermes-bridge] HERMES_API_URL is not set — idling. Set HERMES_API_URL and HERMES_API_KEY to activate this bridge.");
} else {
  console.log(`[hermes-bridge] targeting Hermes at ${HERMES_API_URL}, session ${HERMES_SESSION_ID}`);
  pollHealth();
  refreshPricing();
  setInterval(() => pollHealth().catch((e) => console.error("[hermes-bridge] health poll failed:", e.message)), HEALTH_POLL_MS);
  setInterval(() => pollChat().catch((e) => console.error("[hermes-bridge] chat poll failed:", e.message)), CHAT_POLL_MS);
  setInterval(() => pollTerminalInput().catch((e) => console.error("[hermes-bridge] terminal poll failed:", e.message)), CHAT_POLL_MS);
  setInterval(() => refreshPricing(), PRICING_REFRESH_MS);
}
