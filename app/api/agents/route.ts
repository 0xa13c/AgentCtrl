import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/agents/adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  const adapter = await getAdapter();
  const agents = await adapter.listAgents();
  return NextResponse.json(agents);
}
