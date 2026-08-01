import { NextResponse } from "next/server";
import { listEntries, upsertEntry } from "@/lib/journal/store";
import { AgentId } from "@/types/agents";

export const dynamic = "force-dynamic";

const VALID_IDS: AgentId[] = ["hermes", "codex", "openclaw"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const agentId = url.searchParams.get("agentId") as AgentId | null;
  const limit = Number(url.searchParams.get("limit") || 30);

  if (agentId && !VALID_IDS.includes(agentId)) {
    return NextResponse.json({ error: "Unknown agent id" }, { status: 400 });
  }

  const entries = await listEntries(agentId ?? undefined, limit);
  return NextResponse.json(entries);
}

/**
 * Write path for both the browser (session-cookie gated by middleware as
 * usual) and agent processes calling this directly over the docker
 * network. Machine callers authenticate with a header instead of a
 * session:
 *
 *   curl -X POST http://agentctrl:3000/api/journal \
 *     -H "Content-Type: application/json" \
 *     -H "X-Agent-Token: $AGENTCTRL_AGENT_TOKEN" \
 *     -d '{"agentId":"hermes","content":"Finished syncing the knowledge base."}'
 *
 * AGENTCTRL_AGENT_TOKEN is unset by default (open on your tailnet, same
 * posture as everything else in this app) — set it once you want a real
 * check here even without the full password gate turned on.
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
  if (!body?.content || typeof body.content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const entry = await upsertEntry({
    agentId: body.agentId,
    content: body.content,
    date: body.date,
    mode: body.mode === "replace" ? "replace" : "append",
  });
  return NextResponse.json(entry, { status: 201 });
}
