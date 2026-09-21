import { getRedisClient } from "@/lib/redis";
import { AgentId } from "@/types/agents";

/**
 * Live Terminals — read side of a real bridge's PTY capture.
 *
 * agentctrl:terminal:<agentId>:output  - list, RPUSH raw chunks (may
 *   contain ANSI color codes), oldest first. A real bridge wraps the
 *   agent's actual process and pushes stdout/stderr chunks here as they
 *   happen; the demo harness fakes a plausible CLI session instead.
 * agentctrl:terminal:<agentId>:input   - list, RPUSH commands typed by a
 *   human in interactive mode. A real bridge pops these and writes them
 *   into the PTY's stdin. Only ever written by this app (human-originated),
 *   never by the harness — direction matters here, unlike chat.
 *
 * Read model is cursor-based (not "last N") so the client only ever
 * fetches genuinely new output on each poll instead of re-sending the
 * whole scrollback every second.
 */
const MAX_OUTPUT_LINES = 5000;
const MAX_INPUT_QUEUE = 200;

const outputKey = (agentId: AgentId) => `agentctrl:terminal:${agentId}:output`;
const inputKey = (agentId: AgentId) => `agentctrl:terminal:${agentId}:input`;

export async function getOutputSince(agentId: AgentId, cursor: number, limit = 1000): Promise<{ chunks: string[]; cursor: number; total: number }> {
  const redis = getRedisClient();
  const total = await redis.llen(outputKey(agentId));
  const start = Math.max(cursor, 0);
  if (start >= total) {
    return { chunks: [], cursor: total, total };
  }
  const end = Math.min(start + limit, total) - 1;
  const chunks = await redis.lrange(outputKey(agentId), start, end);
  return { chunks, cursor: start + chunks.length, total };
}

export async function sendInput(agentId: AgentId, command: string): Promise<void> {
  const redis = getRedisClient();
  const key = inputKey(agentId);
  await redis.rpush(key, JSON.stringify({ command, timestamp: new Date().toISOString() }));
  await redis.ltrim(key, -MAX_INPUT_QUEUE, -1);
}

export { MAX_OUTPUT_LINES };
