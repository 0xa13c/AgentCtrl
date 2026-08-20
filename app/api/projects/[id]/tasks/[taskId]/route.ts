import { NextResponse } from "next/server";
import { deleteTask, getProject, updateTask } from "@/lib/projects/store";
import { createApproval } from "@/lib/approvals/store";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  const body = await req.json().catch(() => ({}));

  const before = await getProject(id);
  const prevStatus = before?.tasks.find((t) => t.id === taskId)?.status;

  const project = await updateTask(id, taskId, body);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Dragging a card into "Awaiting Approval" opens a real approval request
  // in the Approvals queue, closing the loop described in the mission
  // control spec's Kanban <-> Approvals integration.
  if (body.status === "awaiting_approval" && prevStatus !== "awaiting_approval") {
    const task = project.tasks.find((t) => t.id === taskId);
    if (task) {
      await createApproval({
        title: `Approve: ${task.title}`,
        description: `Task in project "${project.name}" is awaiting approval.`,
        requestedBy: task.assignedAgentIds[0] ?? "system",
        projectId: id,
        taskId,
      });
    }
  }

  return NextResponse.json(project);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  const project = await deleteTask(id, taskId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}
