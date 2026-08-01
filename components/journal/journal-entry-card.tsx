import { JournalEntry } from "@/types/journal";
import { AgentIcon } from "@/components/hud/agent-icon";

const AGENT_LABEL: Record<string, string> = { hermes: "Hermes", codex: "Codex", openclaw: "OpenClaw" };
const BADGE_BG: Record<string, string> = {
  hermes: "bg-neon-cyan/10 border-neon-cyan/30",
  codex: "bg-neon-violet/10 border-neon-violet/30",
  openclaw: "bg-neon-magenta/10 border-neon-magenta/30",
};

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function JournalEntryCard({ entry }: { entry: JournalEntry }) {
  return (
    <div className="hud-panel p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${BADGE_BG[entry.agentId]}`}>
            <AgentIcon agentId={entry.agentId} size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{AGENT_LABEL[entry.agentId]}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{formatDate(entry.date)}</p>
          </div>
        </div>
        <p className="font-mono text-[9px] text-muted-foreground">
          updated {new Date(entry.updatedAt).toLocaleTimeString("en-US", { hour12: false })}
        </p>
      </div>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{entry.content}</p>
    </div>
  );
}
