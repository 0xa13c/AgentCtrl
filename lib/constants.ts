import { AgentId } from "@/types/agents";

export interface NavAgentEntry {
  id: AgentId;
  label: string;
  href: string;
  glow: "cyan" | "magenta" | "violet";
}

export const NAV_AGENTS: NavAgentEntry[] = [
  { id: "hermes", label: "Hermes", href: "/hermes", glow: "cyan" },
  { id: "codex", label: "Codex", href: "/codex", glow: "violet" },
  { id: "openclaw", label: "OpenClaw", href: "/openclaw", glow: "magenta" },
];

export const GLOW_TEXT: Record<NavAgentEntry["glow"], string> = {
  cyan: "text-neon-cyan text-glow-cyan",
  magenta: "text-neon-magenta text-glow-magenta",
  violet: "text-neon-violet",
};
