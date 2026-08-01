import { getRedisClient } from "@/lib/redis";
import { AgentId } from "@/types/agents";
import { ChatMessage } from "@/types/chat";

/**
 * One Redis list per agent holds the full conversation, oldest first:
 *   agentctrl:chat:<agentId>:messages
 *
 * The dashboard (this file, via API routes) appends "user" role messages.
 * A bridge harness — the demo one, or a real Hermes/Codex/OpenClaw bridge —
 * polls this same list, notices new "user" messages it hasn't replied to
 * yet, and RPUSHes an "agent" role reply back onto it. No pub/sub needed:
 * the UI just re-polls GET /api/chat/<agentId>/messages, same pattern as
 * every other live view in this app.
 */
const MAX_MESSAGES = 500;

const messagesKey = (agentId: AgentId) => `agentctrl:chat:${agentId}:messages`;

export async function listMessages(agentId: AgentId, limit = 200): Promise<ChatMessage[]> {
  const redis = getRedisClient();
  const raw = await redis.lrange(messagesKey(agentId), -limit, -1);
  return raw.map((r) => JSON.parse(r) as ChatMessage);
}

export async function appendMessage(message: Omit<ChatMessage, "id" | "createdAt">): Promise<ChatMessage> {
  const full: ChatMessage = {
    ...message,
    id: `msg-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const redis = getRedisClient();
  const key = messagesKey(message.agentId);
  await redis.rpush(key, JSON.stringify(full));
  await redis.ltrim(key, -MAX_MESSAGES, -1);
  return full;
}
