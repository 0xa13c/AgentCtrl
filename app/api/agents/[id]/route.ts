import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/agents/adapter";
import { AgentId } from "@/types/agents";

export const dynamic = "force-dynamic";

const VALID_IDS: AgentId[] = ["hermes", "codex", "openclaw"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!VALID_IDS.includes(id as AgentId)) {
    return NextResponse.json({ error: "Unknown agent id" }, { status: 404 });
  }
  const adapter = await getAdapter();
  const agent = await adapter.getAgent(id as AgentId);
  return NextResponse.json(agent);
}
