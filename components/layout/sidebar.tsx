"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Activity, Settings, Radio, FolderKanban, BookOpen, MessageSquare, LineChart, ShieldCheck, SquareTerminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_AGENTS } from "@/lib/constants";
import { AgentIcon } from "@/components/hud/agent-icon";
import { useSidebarState } from "@/lib/sidebar-context";
import { useMediaQuery } from "@/lib/use-media-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const glowClasses: Record<string, string> = {
  cyan: "group-hover:shadow-glow-cyan group-hover:border-neon-cyan/60 group-hover:text-neon-cyan",
  magenta: "group-hover:shadow-glow-magenta group-hover:border-neon-magenta/60 group-hover:text-neon-magenta",
  violet: "group-hover:shadow-glow-violet group-hover:border-neon-violet/60 group-hover:text-neon-violet",
};

/**
 * Three responsive states, matched to real breakpoints rather than
 * Tailwind's defaults (which left the sidebar hidden until 1024px with no
 * working way to open it below that):
 *   <600px   — fully hidden, opened as a temporary overlay via the
 *              hamburger button in Topbar.
 *   600-799  — a permanent 48px icon-only rail, labels on hover.
 *   >=800px  — the full labeled sidebar.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { mobileOpen, close } = useSidebarState();
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const isIconRail = useMediaQuery("(min-width: 600px) and (max-width: 799px)");

  useEffect(() => {
    function poll() {
      fetch("/api/approvals?status=pending")
        .then((res) => res.json())
        .then((data) => setPendingApprovals(Array.isArray(data) ? data.length : 0))
        .catch(() => {});
    }
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close the mobile overlay whenever the route changes.
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <TooltipProvider delayDuration={200}>
      {mobileOpen && (
        <div onClick={close} className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm min-[600px]:hidden" aria-hidden />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.06] bg-void-950/95 backdrop-blur-md transition-transform duration-200 ease-out",
          "min-[600px]:static min-[600px]:z-0 min-[600px]:w-12 min-[600px]:translate-x-0 min-[600px]:bg-void-950/60",
          "min-[800px]:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-5 min-[800px]:px-6">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neon-cyan/50 bg-neon-cyan/5 shadow-glow-cyan">
            <Radio className="h-4 w-4 text-neon-cyan" />
          </div>
          <div className="min-[600px]:hidden min-[800px]:block">
            <p className="font-display text-sm font-bold tracking-wider text-foreground">
              AGENT<span className="text-neon-cyan">CTRL</span>
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">mission control</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-6 min-[800px]:px-3">
          <SectionLabel>deck</SectionLabel>
          <SidebarLink href="/" icon={LayoutDashboard} label="Overview" active={pathname === "/"} isIconRail={isIconRail} />
          <SidebarLink href="/chat" icon={MessageSquare} label="Chat" active={pathname === "/chat"} isIconRail={isIconRail} />
          <SidebarLink href="/terminal" icon={SquareTerminal} label="Terminal" active={pathname === "/terminal"} isIconRail={isIconRail} />
          <SidebarLink href="/projects" icon={FolderKanban} label="Projects" active={pathname.startsWith("/projects")} isIconRail={isIconRail} />
          <SidebarLink href="/journal" icon={BookOpen} label="Journal" active={pathname === "/journal"} isIconRail={isIconRail} />
          <SidebarLink
            href="/approvals"
            icon={ShieldCheck}
            label="Approvals"
            active={pathname === "/approvals"}
            badge={pendingApprovals || undefined}
            isIconRail={isIconRail}
          />

          <SectionLabel>agents</SectionLabel>
          {NAV_AGENTS.map((agent) => (
            <Tooltip key={agent.id}>
              <TooltipTrigger asChild>
                <Link href={agent.href} className="group block">
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-all duration-200 min-[600px]:justify-center min-[600px]:px-0 min-[800px]:justify-start min-[800px]:px-3",
                      glowClasses[agent.glow],
                      pathname === agent.href && "border-white/10 bg-white/[0.04] text-foreground"
                    )}
                  >
                    <AgentIcon agentId={agent.id} size={18} className="shrink-0 opacity-90" />
                    <span className="font-medium min-[600px]:hidden min-[800px]:inline">{agent.label}</span>
                    {pathname === agent.href && (
                      <motion.span layoutId="active-dot" className="ml-auto h-1.5 w-1.5 rounded-full bg-neon-cyan shadow-glow-cyan min-[600px]:hidden min-[800px]:block" />
                    )}
                  </div>
                </Link>
              </TooltipTrigger>
              {isIconRail && <TooltipContent side="right">{agent.label}</TooltipContent>}
            </Tooltip>
          ))}

          <SectionLabel>system</SectionLabel>
          <SidebarLink href="/observability" icon={LineChart} label="Observability" active={pathname === "/observability"} isIconRail={isIconRail} />
          <SidebarLink href="/diagnostics" icon={Activity} label="Diagnostics" active={pathname === "/diagnostics"} isIconRail={isIconRail} />
          <SidebarLink href="/settings" icon={Settings} label="Settings" active={pathname === "/settings"} isIconRail={isIconRail} />
        </nav>

        <div className="border-t border-white/[0.06] px-3 py-4 min-[800px]:px-6">
          <div className="flex items-center justify-center gap-2 font-mono text-[10px] text-muted-foreground min-[800px]:justify-start">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse-glow rounded-full bg-neon-green shadow-glow-green" />
            <span className="min-[600px]:hidden min-[800px]:inline">ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-2 pt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground first:pt-0 min-[600px]:hidden min-[800px]:block">
      {children}
    </p>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
  isIconRail,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  badge?: number;
  isIconRail: boolean;
}) {
  const link = (
    <Link href={href} className="block">
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground min-[600px]:justify-center min-[600px]:px-0 min-[800px]:justify-start min-[800px]:px-3",
          active && "bg-white/[0.04] text-foreground"
        )}
      >
        <span className="relative shrink-0">
          <Icon className="h-4 w-4" />
          {badge ? (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-neon-amber shadow-glow-cyan min-[800px]:hidden" />
          ) : null}
        </span>
        <span className="font-medium min-[600px]:hidden min-[800px]:inline">{label}</span>
        {badge ? (
          <span className="ml-auto hidden h-[18px] min-w-[18px] items-center justify-center rounded-full bg-neon-amber/20 px-1.5 font-mono text-[10px] text-neon-amber min-[800px]:flex">
            {badge}
          </span>
        ) : null}
      </div>
    </Link>
  );

  if (!isIconRail) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {label}
        {badge ? ` (${badge})` : ""}
      </TooltipContent>
    </Tooltip>
  );
}
