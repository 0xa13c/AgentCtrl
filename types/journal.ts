import { AgentId } from "./agents";

export interface JournalEntry {
  agentId: AgentId;
  /** Calendar date this entry belongs to, "YYYY-MM-DD". One entry per agent per day. */
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertJournalInput {
  agentId: AgentId;
  content: string;
  /** Defaults to today (UTC) if omitted. */
  date?: string;
  /** "append" (default) adds a timestamped line to today's entry; "replace" overwrites it. */
  mode?: "append" | "replace";
}
