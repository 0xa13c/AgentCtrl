# hermes-bridge

The **real** bridge between a running [Hermes Agent](https://hermes-agent.nousresearch.com)
and AgentCtrl — not a demo. It talks to Hermes's actual OpenAI-compatible API
server and writes real data into the same Redis keys the dashboard already
reads, using the same pattern as `harnesses/example-agent-harness`.

## What it does

- **Health** — polls `GET /health` + `/health/detailed`, writes the Overview
  and `/hermes` page's status tile.
- **Chat** — polls `agentctrl:chat:hermes:messages` for new messages from the
  dashboard's Chat page, calls `POST /v1/runs` with a stable `session_id` so
  Hermes keeps real conversation context, and pushes the final reply back.
- **Live Terminal** — subscribes to each run's `GET /v1/runs/{id}/events` SSE
  stream and pipes `tool.started`/`tool.completed` events into
  `agentctrl:terminal:hermes:output` as colored lines. Interactive input sent
  from the Terminal page triggers a new run the same way chat does.
- **Cost/usage** — reads real `usage.input_tokens`/`output_tokens` off each
  completed run, and computes a $ figure using pricing pulled from
  `GET /api/model/options`.
- **Journal** — optionally (default on) appends a one-line summary to
  today's Hermes journal entry after each completed run.

## What it deliberately does NOT do yet

- **Approvals** — if Hermes emits an `approval.request` event (an untrusted
  MCP tool asking for human sign-off), the bridge just logs it to the
  terminal. Wiring that into AgentCtrl's own Approvals queue (via
  `POST /v1/runs/{id}/approval`) is a clean, contained follow-up once this
  base integration is confirmed working against your real Hermes instance.
- **CPU/memory** — Hermes's API doesn't expose host resource usage, so those
  fields report 0. Wire up `docker stats` separately if you want them
  populated.

## Pricing extraction is best-effort

`/api/model/options`'s exact field names for pricing weren't in the public
docs' prose description, so `extractPrice()` in `index.js` tries several
likely field names and falls back to `costUsd: 0` if none match — token
counts are still accurate either way. Once you run this against a real
Hermes instance, check the server log for:

```
[hermes-bridge] refreshed pricing table (N model entries)
```

If `N` is 0, share a real `GET /api/model/options` response and the
extraction logic can be corrected to match it exactly.

## Config

See the env vars documented at the top of `index.js`. At minimum you need
`HERMES_API_URL` and `HERMES_API_KEY` (the `API_SERVER_KEY` you set in
Hermes's `~/.hermes/.env`) — without `HERMES_API_URL` the process idles
instead of crash-looping, so it's safe to leave in `docker-compose.yml`
before you've configured Hermes.
