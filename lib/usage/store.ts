import { getRedisClient } from "@/lib/redis";
import { AgentId } from "@/types/agents";
import { AgentUsageSeries, DailyUsage, UsageRecord } from "@/types/usage";

/**
 * Cost/token tracking is financial data — never synthesize it. If no
 * harness/agent has reported usage, the UI shows a real empty state, not
 * fake numbers dressed up as telemetry (unlike agent health/tasks, which
 * are fine to demo with the mock adapter).
 *
 * agentctrl:usage:<agentId>:daily  - hash, field=date -> JSON DailyUsage
 * agentctrl:usage:events           - list, capped, raw UsageRecord (all agents)
 */
const ALL_AGENT_IDS: AgentId[] = ["hermes", "codex", "openclaw"];
const EVENTS_KEY = "agentctrl:usage:events";
const MAX_EVENTS = 500;

const dailyKey = (agentId: AgentId) => `agentctrl:usage:${agentId}:daily`;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function recordUsage(input: {
  agentId: AgentId;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  projectId?: string;
  taskId?: string;
}): Promise<UsageRecord> {
  const redis = getRedisClient();
  const date = today();
  const key = dailyKey(input.agentId);

  const existingRaw = await redis.hget(key, date);
  const existing: DailyUsage = existingRaw ? JSON.parse(existingRaw) : { date, tokensIn: 0, tokensOut: 0, costUsd: 0 };
  const updated: DailyUsage = {
    date,
    tokensIn: existing.tokensIn + input.tokensIn,
    tokensOut: existing.tokensOut + input.tokensOut,
    costUsd: Number((existing.costUsd + input.costUsd).toFixed(4)),
  };
  await redis.hset(key, date, JSON.stringify(updated));

  const record: UsageRecord = {
    id: `usage-${crypto.randomUUID().slice(0, 8)}`,
    agentId: input.agentId,
    projectId: input.projectId,
    taskId: input.taskId,
    tokensIn: input.tokensIn,
    tokensOut: input.tokensOut,
    costUsd: input.costUsd,
    timestamp: new Date().toISOString(),
  };
  await redis.lpush(EVENTS_KEY, JSON.stringify(record));
  await redis.ltrim(EVENTS_KEY, 0, MAX_EVENTS - 1);

  return record;
}

export async function getUsageSeries(days = 14): Promise<AgentUsageSeries[]> {
  const redis = getRedisClient();
  const dateKeys = Array.from({ length: days }).map((_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });

  const series: AgentUsageSeries[] = [];
  for (const agentId of ALL_AGENT_IDS) {
    const hash = await redis.hgetall(dailyKey(agentId));
    const byDate = new Map<string, DailyUsage>();
    for (const raw of Object.values(hash)) {
      try {
        const parsed = JSON.parse(raw) as DailyUsage;
        byDate.set(parsed.date, parsed);
      } catch {
        // skip malformed
      }
    }
    const daysSeries = dateKeys.map((date) => byDate.get(date) ?? { date, tokensIn: 0, tokensOut: 0, costUsd: 0 });
    series.push({
      agentId,
      days: daysSeries,
      totalCostUsd: Number(daysSeries.reduce((s, d) => s + d.costUsd, 0).toFixed(4)),
      totalTokens: daysSeries.reduce((s, d) => s + d.tokensIn + d.tokensOut, 0),
    });
  }
  return series;
}

export async function listUsageEvents(limit = 50): Promise<UsageRecord[]> {
  const raw = await getRedisClient().lrange(EVENTS_KEY, 0, limit - 1);
  return raw.map((r) => JSON.parse(r) as UsageRecord);
}

export async function hasAnyUsageData(): Promise<boolean> {
  const redis = getRedisClient();
  const len = await redis.llen(EVENTS_KEY);
  return len > 0;
}
