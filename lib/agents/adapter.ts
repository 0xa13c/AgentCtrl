import { AgentDetail, AgentId, AgentSummary, FleetActivityEvent } from "@/types/agents";

/**
 * AgentAdapter is the single seam between the UI and the outside world.
 *
 * Ship a new implementation (REST polling, WebSocket, Redis pub/sub bridge,
 * gRPC, whatever Hermes/Codex/OpenClaw expose) and swap it in `getAdapter()`
 * below. No component in app/ or components/ needs to change.
 */
export interface AgentAdapter {
  listAgents(): Promise<AgentSummary[]>;
  getAgent(id: AgentId): Promise<AgentDetail>;
  getFleetActivity(limit?: number): Promise<FleetActivityEvent[]>;
  sendCommand(id: AgentId, command: "start" | "stop" | "restart"): Promise<{ ok: boolean }>;
}

import { mockAdapter } from "./mock";

// Swap this line to point at a real adapter once Hermes/Codex/OpenClaw
// expose live endpoints, e.g.:
//   export function getAdapter(): AgentAdapter { return new LiveAgentAdapter(process.env.AGENTCTRL_API_URL!) }
export function getAdapter(): AgentAdapter {
  return mockAdapter;
}
