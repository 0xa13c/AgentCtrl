"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Approval } from "@/types/approvals";
import { PanelHeader } from "@/components/hud/panel";
import { ApprovalCard } from "@/components/approvals/approval-card";
import { Skeleton } from "@/components/ui/skeleton";

export function ApprovalsView() {
  const [approvals, setApprovals] = useState<Approval[] | null>(null);

  function load() {
    fetch("/api/approvals")
      .then((res) => res.json())
      .then(setApprovals);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  function handleResolved(updated: Approval) {
    setApprovals((prev) => prev?.map((a) => (a.id === updated.id ? updated : a)) ?? null);
  }

  const pending = approvals?.filter((a) => a.status === "pending") ?? [];
  const resolved = approvals?.filter((a) => a.status !== "pending") ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">human in the loop</p>
        <h1 className="font-display text-2xl font-black tracking-wide text-foreground">APPROVALS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dragging a task to "Awaiting Approval" on a project board opens a request here — agents can also request approval
          directly via the API.
        </p>
      </div>

      <div>
        <PanelHeader eyebrow={`${pending.length} pending`} title="Needs your decision" />
        {!approvals && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl bg-white/5" />
            ))}
          </div>
        )}
        {approvals && pending.length === 0 && (
          <div className="hud-panel flex flex-col items-center gap-2 p-10 text-center">
            <ShieldCheck className="h-7 w-7 text-neon-green" />
            <p className="text-sm text-muted-foreground">Nothing waiting on you right now.</p>
          </div>
        )}
        <div className="space-y-3">
          {pending.map((a) => (
            <ApprovalCard key={a.id} approval={a} onResolved={handleResolved} />
          ))}
        </div>
      </div>

      {resolved.length > 0 && (
        <div>
          <PanelHeader eyebrow="history" title="Resolved" />
          <div className="space-y-3">
            {resolved.map((a) => (
              <ApprovalCard key={a.id} approval={a} onResolved={handleResolved} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
