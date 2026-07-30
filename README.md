# AgentCtrl

Mission control dashboard for autonomous AI agents — Hermes, Codex, OpenClaw,
and whatever comes next. Built with Next.js, Tailwind CSS, and Framer Motion.

![status](https://img.shields.io/badge/status-active--dev-00f0ff)

## What's here

- **Overview deck** — fleet-wide stats, agent roster, task distribution and
  per-agent comparison charts, live activity feed.
- **Per-agent modules** (`/hermes`, `/codex`, `/openclaw`) — status, start/
  stop/restart controls, throughput + error-rate charts, task queue, live log
  stream.
- **Settings** (`/settings`) — general preferences, agent connection wiring,
  notification toggles, access/deploy reference, about panel.
- **Pluggable adapter layer** (`lib/agents/adapter.ts`) — the dashboard runs
  on a realistic mock data engine out of the box. Swap in real Hermes/Codex/
  OpenClaw endpoints later without touching any UI code.
- **Container + messaging kit** — `Dockerfile`, `docker-compose.yml` (app +
  Redis for agent messaging), Nginx config, and a deploy script for an Oracle
  Cloud Infrastructure VPS. See [`DEPLOY.md`](./DEPLOY.md).

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion ·
Recharts · shadcn/ui · Redis · Docker

## Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Deploying

See [`DEPLOY.md`](./DEPLOY.md) for the full runbook, including the
Tailscale-first access model and the Cloudflare Tunnel option for reaching
the dashboard from outside your tailnet.

## Adding a new agent module

1. Add the id to `types/agents.ts` (`AgentId` union).
2. Add mock/live data for it in `lib/agents/mock.ts` (or your live adapter).
3. Add a nav entry in `lib/constants.ts` (`NAV_AGENTS`).
4. Add a logomark case in `components/hud/agent-icon.tsx`.
5. Create `app/<agent>/page.tsx` — copy `app/hermes/page.tsx` and change the
   id/glow color.
