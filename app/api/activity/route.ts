import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/agents/adapter";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limit = Number(new URL(req.url).searchParams.get("limit") || 20);
  const adapter = await getAdapter();
  const events = await adapter.getFleetActivity(limit);
  return NextResponse.json(events);
}
