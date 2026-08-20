import { NextResponse } from "next/server";
import { listUsageEvents } from "@/lib/usage/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limit = Number(new URL(req.url).searchParams.get("limit") || 50);
  const events = await listUsageEvents(limit);
  return NextResponse.json(events);
}
