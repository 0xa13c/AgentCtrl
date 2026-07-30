import { AgentDetail, AgentId, AgentSummary, AgentTask, FleetActivityEvent, LogEntry, MetricPoint } from "@/types/agents";
import { getRedisClient } from "@/lib/redis";
import { AgentAdapter } from "./adapter";
import { mockAdapter } from "./mock";

/**
 * Redis-backed adapter that reads whatever a bridge harness publishes.
 *
 * Key shape (written by harnesses/example-agent-harness, and the contract
 * any real bridge should follow):
 *   agentctrl:agent:<id>:summary       -> JSON AgentSummary
 *   agentctrl:agent:<id>:tasks         -> JSON AgentTask[]
 *   agentctrl:agent:<id>:logs          -> Redis LIST of JSON LogEntry (newest first)
 *   agentctrl:agent:<id>:throughput    -> JSON MetricPoint[]
 *   agentctrl:agent:<id>:errorHistory  -> JSON MetricPoint[]
 *   agentctrl:activity                 -> Redis LIST of JSON FleetActivityEvent (newest first)
 *
 * If a key is missing (harness not running for that agent yet), each method
 * falls back to the mock engine for that agent so the UI never breaks —
 * you can light up agents one at a time as real bridges come online.
 */
const AGENT_IDS: AgentId[] = ["hermes", "codex", "openclaw"];

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await getRedisClient().get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function readList<T>(key: string, limit: number): Promise<T[] | null> {
  try {
    const raw = await getRedisClient().lrange(key, 0, limit - 1);
    if (!raw.length) return null;
    return raw.map((r) => JSON.parse(r) as T);
  } catch {
    return null;
  }
}

export const liveAdapter: AgentAdapter = {
  async listAgents() {
    const results = await Promise.all(
      AGENT_IDS.map(async (id) => {
        const summary = await readJson<AgentSummary>(`agentctrl:agent:${id}:summary`);
        if (summary) return summary;
        // No harness publishing for this agent yet — fall back to mock so the tile still renders.
        const [mockSummary] = (await mockAdapter.listAgents()).filter((a) => a.id === id);
        return mockSummary;
      })
    );
    return results;
  },

  async getAgent(id: AgentId): Promise<AgentDetail> {
    const [summary, tasks, throughput, errorHistory, logs] = await Promise.all([
      readJson<AgentSummary>(`agentctrl:agent:${id}:summary`),
      readJson<AgentTask[]>(`agentctrl:agent:${id}:tasks`),
      readJson<MetricPoint[]>(`agentctrl:agent:${id}:throughput`),
      readJson<MetricPoint[]>(`agentctrl:agent:${id}:errorHistory`),
      readList<LogEntry>(`agentctrl:agent:${id}:logs`, 30),
    ]);

    if (!summary) {
      // No harness for this agent — full mock fallback for a consistent demo.
      return mockAdapter.getAgent(id);
    }

    return {
      ...summary,
      tasks: tasks ?? [],
      logs: logs ?? [],
      throughput: throughput ?? [],
      errorHistory: errorHistory ?? [],
    };
  },

  async getFleetActivity(limit = 20): Promise<FleetActivityEvent[]> {
    const events = await readList<FleetActivityEvent>("agentctrl:activity", limit);
    return events ?? mockAdapter.getFleetActivity(limit);
  },

  async sendCommand(id, command) {
    // Real bridges would publish a command onto a Redis channel here, e.g.
    //   await getRedisClient().publish(`agentctrl:agent:${id}:commands`, JSON.stringify({ command }));
    // and the harness would act on it. Not implemented for the demo harness.
    console.warn(`[liveAdapter] sendCommand(${id}, ${command}) — no command channel wired up yet, no-op`);
    return { ok: true };
  },
};
