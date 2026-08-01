import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/projects/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const project = await createProject({ name: body.name, description: body.description, goal: body.goal });
  return NextResponse.json(project, { status: 201 });
}
