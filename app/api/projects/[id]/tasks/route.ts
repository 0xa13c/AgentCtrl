import { NextResponse } from "next/server";
import { addTask } from "@/lib/projects/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body?.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const project = await addTask(id, {
    title: body.title,
    description: body.description,
    assignedAgentIds: body.assignedAgentIds,
    priority: body.priority,
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(project, { status: 201 });
}
