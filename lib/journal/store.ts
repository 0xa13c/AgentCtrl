import { getRedisClient } from "@/lib/redis";
import { AgentId } from "@/types/agents";
import { JournalEntry, UpsertJournalInput } from "@/types/journal";

/**
 * One Redis hash per agent (`agentctrl:journal:<agentId>`), field = date
 * ("YYYY-MM-DD"), value = JSON JournalEntry. Guarantees exactly one entry
 * per agent per day — the whole point is a durable "what did I already do
 * today" checkpoint that survives an agent's context getting compacted, so
 * append is the default write mode rather than overwrite.
 */
const ALL_AGENT_IDS: AgentId[] = ["hermes", "codex", "openclaw"];

const journalKey = (agentId: AgentId) => `agentctrl:journal:${agentId}`;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function upsertEntry(input: UpsertJournalInput): Promise<JournalEntry> {
  const date = input.date ?? today();
  const mode = input.mode ?? "append";
  const redis = getRedisClient();
  const key = journalKey(input.agentId);

  const existingRaw = await redis.hget(key, date);
  const existing = existingRaw ? (JSON.parse(existingRaw) as JournalEntry) : null;
  const now = new Date().toISOString();

  let content = input.content;
  if (existing && mode === "append") {
    const timestamp = now.slice(11, 16); // HH:MM
    content = `${existing.content}\n\n[${timestamp}] ${input.content}`;
  }

  const entry: JournalEntry = {
    agentId: input.agentId,
    date,
    content,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await redis.hset(key, date, JSON.stringify(entry));
  return entry;
}

export async function listEntries(agentId?: AgentId, limit = 30): Promise<JournalEntry[]> {
  const redis = getRedisClient();
  const ids = agentId ? [agentId] : ALL_AGENT_IDS;

  const all: JournalEntry[] = [];
  for (const id of ids) {
    const hash = await redis.hgetall(journalKey(id));
    for (const raw of Object.values(hash)) {
      try {
        all.push(JSON.parse(raw) as JournalEntry);
      } catch {
        // skip malformed entries
      }
    }
  }

  return all.sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
}

export async function getEntry(agentId: AgentId, date: string): Promise<JournalEntry | null> {
  const raw = await getRedisClient().hget(journalKey(agentId), date);
  return raw ? (JSON.parse(raw) as JournalEntry) : null;
}
