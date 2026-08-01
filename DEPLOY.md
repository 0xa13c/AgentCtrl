# Deploying AgentCtrl to your Oracle Cloud VPS

## Architecture

```
                 ┌────────────────────────────┐
  Internet ───▶  │  Nginx (80/443, TLS)        │
                 └──────────────┬─────────────┘
                                │ proxy_pass :3000
                 ┌──────────────▼─────────────┐
                 │  agentctrl container        │  Next.js standalone server.
                 │  (this repo)                │  API routes (/api/agents,
                 │                              │  /api/activity) are the only
                 └──────────────┬─────────────┘  thing that touches the adapter.
                                │ reads/writes
                 ┌──────────────▼─────────────┐
                 │  redis container            │  message bus + latest-state store
                 └──────────────┬─────────────┘
                                │ published by
                 ┌──────────────▼─────────────┐
                 │  hermes/codex/openclaw      │  harnesses/example-agent-harness
                 │  bridge harnesses           │  (demo) or your real bridges
                 └────────────────────────────┘
```

The dashboard ships with a **mock adapter** (`lib/agents/mock.ts`) so it's
fully functional out of the box — zero setup, zero Redis required. The
adapter itself is server-only: client components fetch through
`/api/agents`, `/api/agents/[id]`, `/api/agents/[id]/command`, and
`/api/activity` rather than importing it directly, which keeps `ioredis`
out of the browser bundle entirely.

## Try the live data pipeline (no real agents needed yet)

There's a working reference bridge harness at
`harnesses/example-agent-harness` that publishes realistic status into
Redis in the exact shape the live adapter (`lib/agents/live.ts`) reads.
Use it to prove the whole pipeline before wiring up real agents:

```bash
docker compose up -d --build            # app + redis
docker compose --profile demo up -d     # + three demo bridge harnesses
```

Then set `AGENTCTRL_ADAPTER=redis` (in `.env` or `docker-compose.yml`) and
restart the app container:

```bash
docker compose up -d --build agentctrl
```

Visit `/diagnostics` — Redis should show CONNECTED and Adapter Mode should
show REDIS (LIVE). The Overview and per-agent pages are now reading data
published by the demo harnesses every few seconds instead of the mock
engine. Flip `AGENTCTRL_ADAPTER` back off (or unset it) any time to go back
to the synthetic demo.

### Wiring a real agent later

1. Copy `harnesses/example-agent-harness` as a starting point.
2. Replace the simulated `tick()` with real calls into Hermes/Codex/OpenClaw
   (CLI, socket, log tail, whatever it already exposes).
3. Keep writing to the same Redis keys (`agentctrl:agent:<id>:summary`,
   `:tasks`, `:logs`, `:throughput`, `:errorHistory`, and the shared
   `agentctrl:activity` list) — the dashboard needs **zero code changes**.
4. Add the harness as its own `docker-compose.yml` service (see the demo
   ones for the pattern) and drop the corresponding demo bridge.

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
30 days. `/api/health` and `/login` itself stay reachable so health checks
and the login flow always work. This is single-shared-password auth, not
multi-user — swap in NextAuth/SSO if you ever need per-person accounts.

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

## Obsidian vault sync

Projects, Journal entries, and Chat threads can be mirrored as an
Obsidian-ready markdown vault into a **separate** GitHub repo, so you can
open/search/link everything from Obsidian on any machine.

1. Create an empty repo for the vault (same process as AgentCtrl's own repo
   — don't reuse this one).
2. Add to `.env`:
   ```bash
   OBSIDIAN_VAULT_REPO=https://github.com/you/agentctrl-vault.git
   OBSIDIAN_VAULT_TOKEN=github_pat_xxx   # fine-grained, Contents read/write, scoped to the vault repo only
   ```
3. `docker compose up -d --build` (or just restart the `agentctrl` service if
   already running).
4. Check **Settings → Obsidian Vault** in the dashboard — it'll show
   "Not configured" until the env vars are picked up, then sync status +
   a manual "Sync now" button once they are.

Sync runs automatically every 10 minutes (skipped if nothing changed) via
`instrumentation.ts`, which starts the scheduler when the Next.js server
boots — no separate cron/process needed. The vault itself lives in the
`vault-data` Docker volume so its local git history survives container
rebuilds.

To read it in Obsidian: clone `agentctrl-vault` anywhere Obsidian runs (or
use the Obsidian Git community plugin to pull it directly into a vault) —
`Projects/`, `Journal/<agent>/`, and `Chat/` folders, plus an
auto-generated `README.md` index.
