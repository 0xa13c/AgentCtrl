import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/agents/adapter";
import { AgentId } from "@/types/agents";

export const dynamic = "force-dynamic";

const VALID_IDS: AgentId[] = ["hermes", "codex", "openclaw"];
const VALID_COMMANDS = ["start", "stop", "restart"] as const;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!VALID_IDS.includes(id as AgentId)) {
    return NextResponse.json({ error: "Unknown agent id" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const command = body.command;
  if (!VALID_COMMANDS.includes(command)) {
    return NextResponse.json({ error: "Invalid command" }, { status: 400 });
  }

  const adapter = await getAdapter();
  const result = await adapter.sendCommand(id as AgentId, command);
  return NextResponse.json(result);
}
