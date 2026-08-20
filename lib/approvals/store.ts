import { getRedisClient } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit/store";
import { logActivity } from "@/lib/activity/store";
import { updateTask } from "@/lib/projects/store";
import { Approval, ApprovalStatus, CreateApprovalInput } from "@/types/approvals";
import { AgentId } from "@/types/agents";

const INDEX_KEY = "agentctrl:approvals:index";
const approvalKey = (id: string) => `agentctrl:approvals:${id}`;

const KNOWN_AGENT_IDS: AgentId[] = ["hermes", "codex", "openclaw"];

async function saveApproval(approval: Approval) {
  await getRedisClient().set(approvalKey(approval.id), JSON.stringify(approval));
}

export async function createApproval(input: CreateApprovalInput): Promise<Approval> {
  const now = new Date().toISOString();
  const approval: Approval = {
    id: `appr-${crypto.randomUUID().slice(0, 8)}`,
    title: input.title,
    description: input.description,
    requestedBy: input.requestedBy,
    status: "pending",
    projectId: input.projectId,
    taskId: input.taskId,
    createdAt: now,
  };
  const redis = getRedisClient();
  await redis.sadd(INDEX_KEY, approval.id);
  await saveApproval(approval);

  await logAuditEvent({ action: "approval.created", actor: input.requestedBy, target: approval.title, result: "success" });
  await logActivity({
    source: "project",
    level: "warn",
    projectId: approval.projectId,
    agentId: KNOWN_AGENT_IDS.includes(input.requestedBy as AgentId) ? (input.requestedBy as AgentId) : undefined,
    message: `Approval requested: "${approval.title}"`,
  });

  return approval;
}

export async function listApprovals(status?: ApprovalStatus): Promise<Approval[]> {
  const redis = getRedisClient();
  const ids = await redis.smembers(INDEX_KEY);
  if (!ids.length) return [];
  const raw = await redis.mget(ids.map(approvalKey));
  const all = raw.filter((r): r is string => Boolean(r)).map((r) => JSON.parse(r) as Approval);
  const filtered = status ? all.filter((a) => a.status === status) : all;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Resolving an approval that's linked to a Kanban task closes the loop:
 * approved moves the task to Done, rejected sends it back to Blocked so
 * the human's decision is immediately reflected on the board.
 */
export async function resolveApproval(id: string, decision: "approved" | "rejected", resolvedBy = "you"): Promise<Approval | null> {
  const raw = await getRedisClient().get(approvalKey(id));
  if (!raw) return null;
  const approval = JSON.parse(raw) as Approval;
  if (approval.status !== "pending") return approval;

  const updated: Approval = { ...approval, status: decision, resolvedAt: new Date().toISOString(), resolvedBy };
  await saveApproval(updated);

  await logAuditEvent({ action: "approval.resolved", actor: resolvedBy, target: approval.title, result: "success", metadata: { decision } });
  await logActivity({
    source: "project",
    level: decision === "approved" ? "info" : "warn",
    projectId: approval.projectId,
    message: `Approval "${approval.title}" ${decision} by ${resolvedBy}`,
  });

  if (approval.taskId && approval.projectId) {
    await updateTask(approval.projectId, approval.taskId, { status: decision === "approved" ? "done" : "blocked" });
  }

  return updated;
}
