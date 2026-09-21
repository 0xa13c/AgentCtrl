import { NextResponse } from "next/server";
import { sendInput } from "@/lib/terminal/store";
import { logAuditEvent } from "@/lib/audit/store";
import { AgentId } from "@/types/agents";

export const dynamic = "force-dynamic";

const VALID_IDS: AgentId[] = ["hermes", "codex", "openclaw"];

/**
 * Human-originated only — sending terminal input is always a browser-session
 * action (behind the normal cookie gate when AGENTCTRL_PASSWORD is set), never
 * something an external agent process calls. Every command is audit-logged
 * since this is the most privileged action surface in the app.
 */
export async function POST(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  if (!VALID_IDS.includes(agentId as AgentId)) {
    return NextResponse.json({ error: "Unknown agent id" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body?.command || typeof body.command !== "string") {
    return NextResponse.json({ error: "command is required" }, { status: 400 });
  }

  await sendInput(agentId as AgentId, body.command);
  await logAuditEvent({
    action: "terminal.input",
    actor: "you",
    target: `${agentId}: ${body.command.slice(0, 120)}`,
    result: "success",
  });
  return NextResponse.json({ ok: true });
}
