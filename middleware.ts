import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, computeSessionToken, isPasswordGateEnabled } from "@/lib/auth";

// Paths where agent processes write machine-to-machine (no browser session
// cookie to present) — these authenticate via the X-Agent-Token header
// inside their own route handler instead. GET/PATCH on the same paths stay
// behind the normal cookie gate below since those are for the human UI.
const AGENT_WRITE_PATHS = new Set(["/api/journal", "/api/usage", "/api/approvals"]);

export async function middleware(request: NextRequest) {
  if (AGENT_WRITE_PATHS.has(request.nextUrl.pathname) && request.method === "POST") {
    return NextResponse.next();
  }

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
     * (POSTs to AGENT_WRITE_PATHS are handled inside the function above,
     * not here, since GET/PATCH on those same paths must stay gated.)
     */
    "/((?!login|api/login|api/health|_next/static|_next/image|favicon.ico).*)",
  ],
};
