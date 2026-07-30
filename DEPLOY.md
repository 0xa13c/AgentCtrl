# Deploying AgentCtrl to your Oracle Cloud VPS

## Architecture

```
                 ┌────────────────────────────┐
  Internet ───▶  │  Nginx (80/443, TLS)        │
                 └──────────────┬─────────────┘
                                │ proxy_pass :3000
                 ┌──────────────▼─────────────┐
                 │  agentctrl container        │  Next.js standalone server
                 │  (this repo)                │
                 └──────────────┬─────────────┘
                                │ pub/sub, task queues
                 ┌──────────────▼─────────────┐
                 │  redis container            │  message bus for agent events
                 └──────────────┬─────────────┘
                                │
                 ┌──────────────▼─────────────┐
                 │  future: hermes/codex/      │  one container/harness per
                 │  openclaw bridge harnesses  │  agent, publishing to Redis
                 └────────────────────────────┘
```

The dashboard ships with a **mock adapter** (`lib/agents/mock.ts`) so it's fully
functional out of the box. When your real Hermes/Codex/OpenClaw processes are
ready to report status, write a small "bridge harness" per agent that:

1. Talks to the agent however it already talks (CLI, socket, log tail, API).
2. Publishes normalized JSON events to Redis channels (`agent:hermes:status`, etc).
3. Implement `LiveAgentAdapter` in `lib/agents/adapter.ts` reading from Redis/REST,
   and flip the `getAdapter()` export to use it. Zero UI changes required.

Check `/diagnostics` in the running app any time — it pings the real Redis
container over `ioredis` (not mock data) so you can confirm the messaging bus
is actually reachable after you deploy.

## Access model — pick based on who needs in

This dashboard can restart real agents, so **don't expose it to the raw
internet by default.** Layer access instead:

### Option A (today) — Tailscale Serve, zero open ports
You're already SSH'd into the box over Tailscale, so just serve the app on
the tailnet directly — no Nginx, no OCI security-list changes, no public
attack surface at all:
```bash
docker compose up -d --build          # app now listening on 127.0.0.1:3000
sudo tailscale serve https / 3000     # HTTPS on your tailnet, MagicDNS name
```
Any device already in your tailnet (added by you) hits
`https://<machine-name>.<your-tailnet>.ts.net` and gets the dashboard. Nothing
is reachable from outside your tailnet — this is the right default.

### Option B (later) — access from a device NOT on your tailnet
Don't open Nginx to the public internet for this. Instead front it with a
**Cloudflare Tunnel**, which makes an outbound-only connection from the VPS to
Cloudflare (so OCI's security list stays fully closed) and lets you gate
access behind Cloudflare Zero Trust (email OTP / SSO), no VPN client required
on the visiting device:
```bash
# on the VPS
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloudflare-main.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared
cloudflared tunnel login
cloudflared tunnel create agentctrl
cloudflared tunnel route dns agentctrl agentctrl.yourdomain.com
cloudflared tunnel run --url http://localhost:3000 agentctrl
```
Then lock it down in the Cloudflare Zero Trust dashboard: Access policy →
allow only your email/identity.

**Once you go this route, also turn on the built-in password gate** (see
below) — Cloudflare Access protects the edge, but a second layer inside the
app itself is cheap insurance.

### Option C — Nginx + public port
Only reach for `deploy/nginx.conf` if you specifically want a plain public
HTTPS endpoint with your own cert management (Certbot). It's included for
completeness but isn't the recommended default for a control-plane app. If
you do this, **turn on the password gate below** — don't leave a real agent
control surface open on the public internet with no auth in front of it.

## Optional password gate

`middleware.ts` ships a lightweight session gate that's **off by default**
(fine for Tailscale-only access). Turn it on by setting one env var:

```bash
# in .env (see .env.example) or docker-compose.yml
AGENTCTRL_PASSWORD=some-strong-passphrase
```

Restart the container and every route redirects to `/login` until the
correct password is entered; a signed session cookie (HMAC over the
password, so nothing but a hash sits in the cookie) keeps you logged in for
30 days. This is single-shared-password auth, not multi-user — swap in
NextAuth/SSO if you ever need per-person accounts.

## One-time server setup (Oracle Cloud VM)

1. SSH in over Tailscale as usual, install git, clone this repo:
   ```bash
   sudo apt update && sudo apt install -y git
   git clone <your-repo-url> agentctrl && cd agentctrl
   ```
2. Run the deploy script (installs Docker, builds + starts the app + Redis):
   ```bash
   chmod +x deploy/deploy.sh
   ./deploy/deploy.sh --no-firewall   # skip opening 80/443, you're going Tailscale-first
   ```
3. Pick Option A, B, or C above for how you actually want to reach it.

## Redeploying after changes

```bash
git pull
docker compose up -d --build
```

## Adding a new agent module later

1. Add the id to `types/agents.ts` (`AgentId` union).
2. Add mock/live data for it in `lib/agents/mock.ts` (or your live adapter).
3. Add a nav entry in `lib/constants.ts` (`NAV_AGENTS`).
4. Add a logomark case in `components/hud/agent-icon.tsx`.
5. Create `app/<agent>/page.tsx` — copy `app/hermes/page.tsx` and change the id/glow.

That's the entire integration surface — the shared `AgentModuleView` component
handles layout, charts, task queue, and logs for any agent that implements the
`AgentAdapter` interface.
