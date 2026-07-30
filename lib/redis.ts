import Redis from "ioredis";

/**
 * Lazily-created Redis client shared by health checks (pingRedis) and the
 * live agent adapter (lib/agents/live.ts). Server-only — never import this
 * from a "use client" component.
 */
let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      lazyConnect: true,
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    client.on("error", () => {
      /* swallowed — surfaced via pingRedis()'s return value / caller try-catch instead */
    });
  }
  return client;
}

export async function pingRedis(): Promise<{ ok: boolean; latencyMs: number | null; error?: string }> {
  const started = Date.now();
  try {
    const redis = getRedisClient();
    if (redis.status === "end" || redis.status === "close" || redis.status === "wait") {
      await redis.connect();
    }
    await redis.ping();
    return { ok: true, latencyMs: Date.now() - started };
  } catch (err) {
    return { ok: false, latencyMs: null, error: err instanceof Error ? err.message : "unknown error" };
  }
}
