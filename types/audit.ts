export type AuditAction =
  | "agent.command"
  | "project.created"
  | "project.deleted"
  | "task.status_changed"
  | "vault.sync"
  | "auth.login_success"
  | "auth.login_failure"
  | "approval.created"
  | "approval.resolved";

export interface AuditEvent {
  id: string;
  action: AuditAction;
  actor: string;
  target?: string;
  result: "success" | "failure";
  metadata?: Record<string, unknown>;
  timestamp: string;
}
