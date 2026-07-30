import { NextResponse } from "next/server";
import { pingRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const START_TIME = Date.now();

export async function GET() {
  const redis = await pingRedis();

  return NextResponse.json({
    ok: true,
    server: {
      uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
      nodeVersion: process.version,
      env: process.env.NODE_ENV,
    },
    redis,
    adapterMode: process.env.AGENTCTRL_ADAPTER === "redis" ? "redis" : "mock",
    timestamp: new Date().toISOString(),
  });
}
