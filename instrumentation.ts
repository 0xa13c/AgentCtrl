/**
 * Next.js instrumentation hook — runs once when the server process starts
 * (both `next dev` and the production standalone server). Used here to
 * kick off the Obsidian vault sync scheduler in the background, without
 * needing a separate process/cron.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startVaultSyncScheduler } = await import("@/lib/vault/sync");
    startVaultSyncScheduler();
  }
}
