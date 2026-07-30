# example-agent-harness

A **reference implementation** of the "bridge harness" pattern described in
the root `DEPLOY.md`. It doesn't talk to a real agent — it simulates one and
publishes realistic status into Redis in exactly the shape
`lib/agents/live.ts` reads back.

Use it to:

1. Prove the full pipeline works on your VPS (harness → Redis → live
   adapter → UI) before wiring up a real agent.
2. Copy it as the starting point for a real bridge: replace `tick()`'s
   simulated data with actual calls into Hermes/Codex/OpenClaw, keep the
   Redis-write shape identical, and the dashboard needs zero changes.

Run all three demo agents alongside the dashboard:

```bash
docker compose --profile demo up -d
```

Then set `AGENTCTRL_ADAPTER=redis` (see `.env.example`) and restart the
`agentctrl` container — the Overview/Hermes/Codex/OpenClaw pages and
`/diagnostics` will now be reading real Redis-backed data instead of the
mock engine.
