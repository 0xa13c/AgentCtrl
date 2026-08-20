import { getRedisClient } from "@/lib/redis";
import { AuditAction, AuditEvent } from "@/types/audit";

/**
 * Append-only-ish security/action trail — distinct from lib/activity/store.ts,
 * which is a human-glanceable "what's happening" feed. This is the formal
 * record: who/what did an action, on what target, with what result. Capped
 * at a much larger size than the activity feed since audit history is meant
 * to be retained longer.
 */
const KEY = "agentctrl:audit";
const MAX_EVENTS = 2000;

export async function logAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">): Promise<void> {
  const full: AuditEvent = {
    ...event,
    id: `audit-${crypto.randomUUID().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
  };
  const redis = getRedisClient();
  await redis.lpush(KEY, JSON.stringify(full));
  await redis.ltrim(KEY, 0, MAX_EVENTS - 1);
}

export async function listAuditEvents(limit = 100, actionFilter?: AuditAction): Promise<AuditEvent[]> {
  const redis = getRedisClient();
  // Over-fetch a bit when filtering client-side by action, since Redis lists
  // don't support server-side filtering — fine at this volume (thousands, not millions).
  const raw = await redis.lrange(KEY, 0, actionFilter ? MAX_EVENTS - 1 : limit - 1);
  const events = raw.map((r) => JSON.parse(r) as AuditEvent);
  const filtered = actionFilter ? events.filter((e) => e.action === actionFilter) : events;
  return filtered.slice(0, limit);
}
