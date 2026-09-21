import { NextResponse } from "next/server";
import { getOutputSince } from "@/lib/terminal/store";
import { AgentId } from "@/types/agents";

export const dynamic = "force-dynamic";

const VALID_IDS: AgentId[] = ["hermes", "codex", "openclaw"];

export async function GET(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  if (!VALID_IDS.includes(agentId as AgentId)) {
    return NextResponse.json({ error: "Unknown agent id" }, { status: 404 });
  }
  const url = new URL(req.url);
  const cursor = Number(url.searchParams.get("cursor") || 0);
  const limit = Number(url.searchParams.get("limit") || 1000);
  const result = await getOutputSince(agentId as AgentId, cursor, limit);
  return NextResponse.json(result);
}
