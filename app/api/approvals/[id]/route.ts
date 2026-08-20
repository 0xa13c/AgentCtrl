import { NextResponse } from "next/server";
import { resolveApproval } from "@/lib/approvals/store";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.decision !== "approved" && body.decision !== "rejected") {
    return NextResponse.json({ error: "decision must be 'approved' or 'rejected'" }, { status: 400 });
  }
  const approval = await resolveApproval(id, body.decision, "you");
  if (!approval) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(approval);
}
