import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

import { listProjects } from "@/lib/projects/store";
import { listEntries } from "@/lib/journal/store";
import { listMessages } from "@/lib/chat/store";
import { logAuditEvent } from "@/lib/audit/store";
import { AgentId } from "@/types/agents";
import { journalFilename, projectFilename, renderChatMarkdown, renderJournalMarkdown, renderProjectMarkdown, vaultReadme } from "./render";

const execFileAsync = promisify(execFile);

const VAULT_DIR = process.env.AGENTCTRL_VAULT_DIR || path.join(process.cwd(), "vault");
const ALL_AGENT_IDS: AgentId[] = ["hermes", "codex", "openclaw"];

export interface VaultSyncResult {
  ok: boolean;
  synced: boolean; // true only if there were changes and they were committed+pushed
  message: string;
  timestamp: string;
}

export interface VaultStatus {
  configured: boolean;
  running: boolean;
  lastRun: VaultSyncResult | null;
  intervalMinutes: number;
}

const state: { lastRun: VaultSyncResult | null; running: boolean } = { lastRun: null, running: false };

export function isVaultConfigured(): boolean {
  return Boolean(process.env.OBSIDIAN_VAULT_REPO);
}

export function getVaultStatus(): VaultStatus {
  return {
    configured: isVaultConfigured(),
    running: state.running,
    lastRun: state.lastRun,
    intervalMinutes: 10,
  };
}

async function git(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, { cwd: VAULT_DIR });
  return stdout.trim();
}

async function ensureRepo(repoUrl: string) {
  await fs.mkdir(VAULT_DIR, { recursive: true });
  try {
    await fs.access(path.join(VAULT_DIR, ".git"));
  } catch {
    await execFileAsync("git", ["init", "-q"], { cwd: VAULT_DIR });
    await execFileAsync("git", ["checkout", "-B", "main"], { cwd: VAULT_DIR });
    await execFileAsync("git", ["remote", "add", "origin", repoUrl], { cwd: VAULT_DIR });
  }
  await execFileAsync("git", ["config", "user.email", process.env.OBSIDIAN_VAULT_GIT_EMAIL || "vault-sync@agentctrl.local"], { cwd: VAULT_DIR });
  await execFileAsync("git", ["config", "user.name", process.env.OBSIDIAN_VAULT_GIT_NAME || "AgentCtrl Vault Sync"], { cwd: VAULT_DIR });
}

async function writeVaultFiles() {
  const projects = await listProjects();
  const projectsDir = path.join(VAULT_DIR, "Projects");
  await fs.mkdir(projectsDir, { recursive: true });
  for (const project of projects) {
    await fs.writeFile(path.join(projectsDir, projectFilename(project)), renderProjectMarkdown(project));
  }

  let journalCount = 0;
  for (const agentId of ALL_AGENT_IDS) {
    const entries = await listEntries(agentId, 3650);
    const agentDir = path.join(VAULT_DIR, "Journal", agentId);
    await fs.mkdir(agentDir, { recursive: true });
    for (const entry of entries) {
      await fs.writeFile(path.join(agentDir, journalFilename(entry)), renderJournalMarkdown(entry));
      journalCount++;
    }
  }

  const chatDir = path.join(VAULT_DIR, "Chat");
  await fs.mkdir(chatDir, { recursive: true });
  let chatThreads = 0;
  for (const agentId of ALL_AGENT_IDS) {
    const messages = await listMessages(agentId, 1000);
    if (messages.length === 0) continue;
    await fs.writeFile(path.join(chatDir, `${agentId}.md`), renderChatMarkdown(agentId, messages));
    chatThreads++;
  }

  await fs.writeFile(path.join(VAULT_DIR, "README.md"), vaultReadme({ projects: projects.length, journalEntries: journalCount, chatThreads }));
}

/**
 * Regenerates every markdown file from current Redis state, then commits +
 * pushes only if something actually changed (idempotent — safe to call on
 * a timer, on demand, or right after boot).
 */
export async function syncVault(): Promise<VaultSyncResult> {
  const timestamp = new Date().toISOString();
  const repoUrl = process.env.OBSIDIAN_VAULT_REPO;
  const token = process.env.OBSIDIAN_VAULT_TOKEN;

  if (!repoUrl) {
    const result = { ok: true, synced: false, message: "Not configured (OBSIDIAN_VAULT_REPO unset).", timestamp };
    state.lastRun = result;
    return result;
  }

  if (state.running) {
    return { ok: true, synced: false, message: "A sync is already in progress.", timestamp };
  }
  state.running = true;

  try {
    await ensureRepo(repoUrl);
    await writeVaultFiles();

    await git(["add", "-A"]);
    const statusOutput = await git(["status", "--porcelain"]);
    if (!statusOutput) {
      const result = { ok: true, synced: false, message: "No changes since last sync.", timestamp };
      state.lastRun = result;
      return result;
    }

    await git(["commit", "-q", "-m", `Vault sync ${timestamp}`]);

    if (token) {
      const authedUrl = repoUrl.replace("https://", `https://x-access-token:${token}@`);
      await execFileAsync("git", ["push", authedUrl, "HEAD:main"], { cwd: VAULT_DIR });
    } else {
      // No token configured — commit locally but skip the push, and say so clearly.
      const result = {
        ok: true,
        synced: false,
        message: "Committed locally but OBSIDIAN_VAULT_TOKEN is unset, so nothing was pushed.",
        timestamp,
      };
      state.lastRun = result;
      return result;
    }

    const result = { ok: true, synced: true, message: "Synced and pushed successfully.", timestamp };
    state.lastRun = result;
    await logAuditEvent({ action: "vault.sync", actor: "system", result: "success", metadata: { message: result.message } });
    return result;
  } catch (err) {
    const result = {
      ok: false,
      synced: false,
      message: err instanceof Error ? err.message : "Unknown vault sync error",
      timestamp,
    };
    state.lastRun = result;
    await logAuditEvent({ action: "vault.sync", actor: "system", result: "failure", metadata: { message: result.message } });
    return result;
  } finally {
    state.running = false;
  }
}

const INTERVAL_MS = 10 * 60 * 1000;

export function startVaultSyncScheduler() {
  const globalKey = "__agentctrlVaultSyncStarted";
  const g = globalThis as unknown as Record<string, boolean>;
  if (g[globalKey]) return;
  g[globalKey] = true;

  if (!isVaultConfigured()) {
    console.log("[vault-sync] OBSIDIAN_VAULT_REPO unset — scheduler idle. Set it in .env to enable Obsidian sync.");
    return;
  }

  console.log(`[vault-sync] scheduler starting, syncing every ${INTERVAL_MS / 60000} minutes`);
  setTimeout(() => syncVault().catch((e) => console.error("[vault-sync] initial sync failed:", e)), 15_000);
  setInterval(() => {
    syncVault().catch((e) => console.error("[vault-sync] scheduled sync failed:", e));
  }, INTERVAL_MS);
}
