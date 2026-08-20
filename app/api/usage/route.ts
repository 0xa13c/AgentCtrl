import { NextResponse } from "next/server";
import { getUsageSeries, hasAnyUsageData, recordUsage } from "@/lib/usage/store";
import { AgentId } from "@/types/agents";

export const dynamic = "force-dynamic";

const VALID_IDS: AgentId[] = ["hermes", "codex", "openclaw"];

export async function GET(req: Request) {
  const days = Number(new URL(req.url).searchParams.get("days") || 14);
  const [series, hasData] = await Promise.all([getUsageSeries(days), hasAnyUsageData()]);
  return NextResponse.json({ series, hasData });
}

/**
 * Machine-to-machine like /api/journal — a real bridge reports actual token/
 * cost usage here. Gated by AGENTCTRL_AGENT_TOKEN when set (see middleware.ts).
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
  if (!body?.agentId || !VALID_IDS.includes(body.agentId)) {
    return NextResponse.json({ error: "agentId must be one of hermes, codex, openclaw" }, { status: 400 });
  }

  const record = await recordUsage({
    agentId: body.agentId,
    tokensIn: Number(body.tokensIn) || 0,
    tokensOut: Number(body.tokensOut) || 0,
    costUsd: Number(body.costUsd) || 0,
    projectId: body.projectId,
    taskId: body.taskId,
  });
  return NextResponse.json(record, { status: 201 });
}
