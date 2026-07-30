import Redis from "ioredis";

/**
 * Lazily-created Redis client for health checks and, later, the live
 * agent-event bus. Safe to import from server code (API routes) only —
 * never import this from a "use client" component.
 */
let client: Redis | null = null;

function getClient(): Redis {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      lazyConnect: true,
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't keep retrying in a health-check context
    });
    client.on("error", () => {
      /* swallowed — surfaced via pingRedis()'s return value instead */
    });
  }
  return client;
}

export async function pingRedis(): Promise<{ ok: boolean; latencyMs: number | null; error?: string }> {
  const started = Date.now();
  try {
    const redis = getClient();
    if (redis.status === "end" || redis.status === "close") {
      await redis.connect();
    }
    await redis.ping();
    return { ok: true, latencyMs: Date.now() - started };
  } catch (err) {
    return { ok: false, latencyMs: null, error: err instanceof Error ? err.message : "unknown error" };
  }
}
