import { AgentId } from "./agents";

export interface UsageRecord {
  id: string;
  agentId: AgentId;
  projectId?: string;
  taskId?: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  timestamp: string;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

export interface AgentUsageSeries {
  agentId: AgentId;
  days: DailyUsage[];
  totalCostUsd: number;
  totalTokens: number;
}
