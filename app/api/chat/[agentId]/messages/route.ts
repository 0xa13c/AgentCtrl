import { NextResponse } from "next/server";
import { appendMessage, listMessages } from "@/lib/chat/store";
import { addTask } from "@/lib/projects/store";
import { AgentId } from "@/types/agents";

export const dynamic = "force-dynamic";

const VALID_IDS: AgentId[] = ["hermes", "codex", "openclaw"];

export async function GET(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  if (!VALID_IDS.includes(agentId as AgentId)) {
    return NextResponse.json({ error: "Unknown agent id" }, { status: 404 });
  }
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 200);
  const messages = await listMessages(agentId as AgentId, limit);
  return NextResponse.json(messages);
}

export async function POST(req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  if (!VALID_IDS.includes(agentId as AgentId)) {
    return NextResponse.json({ error: "Unknown agent id" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body?.content || typeof body.content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  let taskId: string | undefined;
  if (body.createTask && body.projectId) {
    const project = await addTask(body.projectId, {
      title: body.content.length > 80 ? `${body.content.slice(0, 77)}...` : body.content,
      description: body.content,
      assignedAgentIds: [agentId as AgentId],
    });
    taskId = project?.tasks[project.tasks.length - 1]?.id;
  }

  const message = await appendMessage({
    agentId: agentId as AgentId,
    role: "user",
    content: body.content,
    projectId: body.projectId || undefined,
    taskId,
  });

  return NextResponse.json(message, { status: 201 });
}
