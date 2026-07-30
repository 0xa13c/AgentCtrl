import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, computeSessionToken, isPasswordGateEnabled } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  // Gate is opt-in: unset AGENTCTRL_PASSWORD (the default) means fully open,
  // which is fine when the dashboard only lives on your Tailscale tailnet.
  if (!isPasswordGateEnabled()) {
    return NextResponse.next();
  }

  const password = process.env.AGENTCTRL_PASSWORD!;
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const expected = await computeSessionToken(password);

  if (cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match everything except:
     * - /login (the gate itself)
     * - /api/login (the auth endpoint)
     * - /api/health (lets diagnostics/uptime checks work without a session)
     * - static assets and Next internals
     */
    "/((?!login|api/login|api/health|_next/static|_next/image|favicon.ico).*)",
  ],
};
