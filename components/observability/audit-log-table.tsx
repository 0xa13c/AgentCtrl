import { AuditEvent } from "@/types/audit";
import { cn } from "@/lib/utils";

const ACTION_LABEL: Record<string, string> = {
  "agent.command": "Agent Command",
  "project.created": "Project Created",
  "project.deleted": "Project Deleted",
  "task.status_changed": "Task Status Changed",
  "vault.sync": "Vault Sync",
  "auth.login_success": "Login Success",
  "auth.login_failure": "Login Failure",
  "approval.created": "Approval Created",
  "approval.resolved": "Approval Resolved",
};

export function AuditLogTable({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No audit events yet.</p>;
  }

  return (
    <div className="scrollbar-hud max-h-[28rem] overflow-y-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-void-900">
          <tr className="border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-3">Time</th>
            <th className="py-2 pr-3">Action</th>
            <th className="py-2 pr-3">Actor</th>
            <th className="py-2 pr-3">Target</th>
            <th className="py-2">Result</th>
          </tr>
        </thead>
        <tbody>
          {events.map((evt) => (
            <tr key={evt.id} className="border-b border-white/[0.03]">
              <td className="whitespace-nowrap py-2 pr-3 font-mono text-[10px] text-muted-foreground">
                {new Date(evt.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </td>
              <td className="py-2 pr-3 text-xs text-foreground">{ACTION_LABEL[evt.action] ?? evt.action}</td>
              <td className="py-2 pr-3 font-mono text-[10px] text-neon-cyan">{evt.actor}</td>
              <td className="max-w-[240px] truncate py-2 pr-3 text-xs text-muted-foreground">{evt.target ?? "—"}</td>
              <td className="py-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                    evt.result === "success" ? "border-neon-green/30 bg-neon-green/10 text-neon-green" : "border-neon-red/30 bg-neon-red/10 text-neon-red"
                  )}
                >
                  {evt.result}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
