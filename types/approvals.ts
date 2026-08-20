export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Approval {
  id: string;
  title: string;
  description?: string;
  requestedBy: string; // AgentId, "system", or "you"
  status: ApprovalStatus;
  projectId?: string;
  taskId?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface CreateApprovalInput {
  title: string;
  description?: string;
  requestedBy: string;
  projectId?: string;
  taskId?: string;
}
