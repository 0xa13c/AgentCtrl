import { NextResponse } from "next/server";
import { createApproval, listApprovals } from "@/lib/approvals/store";
import { ApprovalStatus } from "@/types/approvals";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status") as ApprovalStatus | null;
  const approvals = await listApprovals(status ?? undefined);
  return NextResponse.json(approvals);
}

/**
 * Machine-to-machine like /api/journal's POST — lets an agent process open
 * an approval request outside the Kanban flow (e.g. "OpenClaw wants to
 * spend $30 on image generation"). Gated by AGENTCTRL_AGENT_TOKEN when set.
 */
export async function POST(req: Request) {
  const requiredToken = process.env.AGENTCTRL_AGENT_TOKEN;
  if (requiredToken) {
    const provided = req.headers.get("x-agent-token");
    if (provided !== requiredToken) {
      return NextResponse.json({ error: "Invalid or missing X-Agent-Token" }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => ({}));
  if (!body?.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!body?.requestedBy || typeof body.requestedBy !== "string") {
    return NextResponse.json({ error: "requestedBy is required" }, { status: 400 });
  }

  const approval = await createApproval({
    title: body.title,
    description: body.description,
    requestedBy: body.requestedBy,
    projectId: body.projectId,
    taskId: body.taskId,
  });
  return NextResponse.json(approval, { status: 201 });
}
