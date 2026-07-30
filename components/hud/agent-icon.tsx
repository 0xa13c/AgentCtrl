import { AgentId } from "@/types/agents";

const GRADIENTS: Record<AgentId, [string, string]> = {
  hermes: ["#00f0ff", "#0a7cff"],
  codex: ["#a855f7", "#6d28d9"],
  openclaw: ["#ff2ee6", "#c026d3"],
};

/**
 * Small abstract vector logomarks per agent — crisp at any size, no raster
 * assets to manage, and easy to extend when a new agent joins the roster
 * (just add an id + path below).
 */
export function AgentIcon({ agentId, size = 28, className }: { agentId: AgentId; size?: number; className?: string }) {
  const gradId = `grad-${agentId}`;
  const [from, to] = GRADIENTS[agentId];

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>

      {agentId === "hermes" && (
        <>
          <circle cx="20" cy="20" r="18" stroke={`url(#${gradId})`} strokeWidth="1.4" opacity="0.35" />
          <path d="M20 6 L20 34 M20 6 L11 13 M20 6 L29 13 M12 20 L28 20 M13 27 L27 27"
            stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20" cy="6" r="2.6" fill={`url(#${gradId})`} />
        </>
      )}

      {agentId === "codex" && (
        <>
          <rect x="3" y="3" width="34" height="34" rx="9" stroke={`url(#${gradId})`} strokeWidth="1.4" opacity="0.35" />
          <path d="M16 12 L8 20 L16 28 M24 12 L32 20 L24 28"
            stroke={`url(#${gradId})`} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}

      {agentId === "openclaw" && (
        <>
          <circle cx="20" cy="20" r="18" stroke={`url(#${gradId})`} strokeWidth="1.4" opacity="0.35" />
          <path d="M13 10 C 9 16, 9 24, 13 31 M13 15 C 11 19, 11 23, 13 27"
            stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M27 10 C 31 16, 31 24, 27 31 M27 15 C 29 19, 29 23, 27 27"
            stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <circle cx="20" cy="20" r="3.4" fill={`url(#${gradId})`} />
        </>
      )}
    </svg>
  );
}
