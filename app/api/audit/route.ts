import { NextResponse } from "next/server";
import { listAuditEvents } from "@/lib/audit/store";
import { AuditAction } from "@/types/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 100);
  const action = (url.searchParams.get("action") as AuditAction | null) ?? undefined;
  const events = await listAuditEvents(limit, action);
  return NextResponse.json(events);
}
