import { AgentDetail, AgentId, AgentSummary, FleetActivityEvent } from "@/types/agents";

/**
 * AgentAdapter is the single seam between the app and the outside world.
 *
 * IMPORTANT: this module (and any adapter it returns) is server-only — it's
 * only ever imported from app/api/** route handlers, never from a "use
 * client" component. The live Redis adapter pulls in ioredis, which can't
 * run in the browser, so client components fetch through /api/agents/* and
 * /api/activity instead of calling getAdapter() themselves.
 *
 * Ship a new implementation (REST polling, WebSocket, Redis-backed bridge,
 * gRPC, whatever Hermes/Codex/OpenClaw expose) and swap it in `getAdapter()`
 * below. No API route or UI component needs to change.
 */
export interface AgentAdapter {
  listAgents(): Promise<AgentSummary[]>;
  getAgent(id: AgentId): Promise<AgentDetail>;
  getFleetActivity(limit?: number): Promise<FleetActivityEvent[]>;
  sendCommand(id: AgentId, command: "start" | "stop" | "restart"): Promise<{ ok: boolean }>;
}

import { mockAdapter } from "./mock";

// Two ways to run this today:
//   AGENTCTRL_ADAPTER unset (default) -> mockAdapter, fully synthetic, zero setup.
//   AGENTCTRL_ADAPTER=redis           -> liveAdapter, reads harnesses/example-agent-harness
//                                        (or any real bridge) publishing into Redis.
// Write your own LiveAgentAdapter (REST/gRPC/etc) and add a branch here for a third mode.
export async function getAdapter(): Promise<AgentAdapter> {
  if (process.env.AGENTCTRL_ADAPTER === "redis") {
    const { liveAdapter } = await import("./live");
    return liveAdapter;
  }
  return mockAdapter;
}
