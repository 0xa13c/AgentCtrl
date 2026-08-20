"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, Loader2, FolderKanban } from "lucide-react";
import { Approval } from "@/types/approvals";
import { cn } from "@/lib/utils";

export function ApprovalCard({ approval, onResolved }: { approval: Approval; onResolved: (updated: Approval) => void }) {
  const [pending, setPending] = useState<"approved" | "rejected" | null>(null);

  async function resolve(decision: "approved" | "rejected") {
    setPending(decision);
    try {
      const res = await fetch(`/api/approvals/${approval.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) onResolved(await res.json());
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="hud-panel p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{approval.title}</p>
          {approval.description && <p className="mt-0.5 text-xs text-muted-foreground">{approval.description}</p>}
        </div>
        <span className="shrink-0 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neon-cyan">
          {approval.requestedBy}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{new Date(approval.createdAt).toLocaleString()}</span>
          {approval.projectId && (
            <Link href={`/projects/${approval.projectId}`} className="flex items-center gap-1 text-neon-cyan hover:underline">
              <FolderKanban className="h-3 w-3" /> View project
            </Link>
          )}
        </div>

        {approval.status === "pending" ? (
          <div className="flex gap-2">
            <button
              onClick={() => resolve("rejected")}
              disabled={pending !== null}
              className="flex items-center gap-1.5 rounded-md border border-neon-red/30 bg-neon-red/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-neon-red transition-all hover:shadow-glow-red disabled:opacity-50"
            >
              {pending === "rejected" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              Reject
            </button>
            <button
              onClick={() => resolve("approved")}
              disabled={pending !== null}
              className="flex items-center gap-1.5 rounded-md border border-neon-green/30 bg-neon-green/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-neon-green transition-all hover:shadow-glow-green disabled:opacity-50"
            >
              {pending === "approved" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Approve
            </button>
          </div>
        ) : (
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider",
              approval.status === "approved" ? "border-neon-green/30 bg-neon-green/10 text-neon-green" : "border-neon-red/30 bg-neon-red/10 text-neon-red"
            )}
          >
            {approval.status} by {approval.resolvedBy}
          </span>
        )}
      </div>
    </div>
  );
}
