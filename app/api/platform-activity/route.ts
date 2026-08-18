import { NextResponse } from "next/server";
import { listActivity } from "@/lib/activity/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limit = Number(new URL(req.url).searchParams.get("limit") || 30);
  const events = await listActivity(limit);
  return NextResponse.json(events);
}
