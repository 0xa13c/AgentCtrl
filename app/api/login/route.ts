import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { SESSION_COOKIE, computeSessionToken, isPasswordGateEnabled } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isPasswordGateEnabled()) {
    return NextResponse.json({ ok: true }); // gate disabled — nothing to check
  }

  const { password } = await request.json().catch(() => ({ password: "" }));
  const expectedPassword = process.env.AGENTCTRL_PASSWORD!;

  const a = Buffer.from(String(password || ""));
  const b = Buffer.from(expectedPassword);
  const match = a.length === b.length && timingSafeEqual(a, b);

  if (!match) {
    await logAuditEvent({ action: "auth.login_failure", actor: "unknown", result: "failure" });
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }

  await logAuditEvent({ action: "auth.login_success", actor: "you", result: "success" });

  const token = await computeSessionToken(expectedPassword);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
