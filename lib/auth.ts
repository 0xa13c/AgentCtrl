/**
 * Minimal password-gate helpers. Uses Web Crypto (available in both the
 * Node and Edge runtimes) so the same function works from middleware and
 * from the login API route.
 *
 * This is intentionally simple: one shared password, one session cookie.
 * It exists to keep the dashboard from being wide open once it's reachable
 * beyond your own devices — swap for real auth (NextAuth, SSO, etc.) if
 * you ever have multiple operators.
 */

export const SESSION_COOKIE = "agentctrl_session";

export async function computeSessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`agentctrl-session:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isPasswordGateEnabled(): boolean {
  return Boolean(process.env.AGENTCTRL_PASSWORD);
}
