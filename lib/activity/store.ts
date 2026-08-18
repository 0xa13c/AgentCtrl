import { getRedisClient } from "@/lib/redis";
import { PlatformActivityEvent } from "@/types/activity";

/**
 * Cross-cutting activity feed: project/task changes, journal entries, and
 * chat messages all land here so the Overview page can show one unified
 * "what happened" timeline instead of just agent telemetry. Separate from
 * the per-agent Redis lists the mock/live adapter reads — this is
 * platform-level, not agent-runtime-level.
 */
const KEY = "agentctrl:platform-activity";
const MAX_EVENTS = 300;

export async function logActivity(event: Omit<PlatformActivityEvent, "id" | "timestamp">): Promise<void> {
  const full: PlatformActivityEvent = {
    ...event,
    id: `pa-${crypto.randomUUID().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
  };
  const redis = getRedisClient();
  await redis.lpush(KEY, JSON.stringify(full));
  await redis.ltrim(KEY, 0, MAX_EVENTS - 1);
}

export async function listActivity(limit = 30): Promise<PlatformActivityEvent[]> {
  const raw = await getRedisClient().lrange(KEY, 0, limit - 1);
  return raw.map((r) => JSON.parse(r) as PlatformActivityEvent);
}
