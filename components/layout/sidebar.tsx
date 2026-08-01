"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Activity, Settings, Radio, FolderKanban, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_AGENTS } from "@/lib/constants";
import { AgentIcon } from "@/components/hud/agent-icon";

const glowClasses: Record<string, string> = {
  cyan: "group-hover:shadow-glow-cyan group-hover:border-neon-cyan/60 group-hover:text-neon-cyan",
  magenta: "group-hover:shadow-glow-magenta group-hover:border-neon-magenta/60 group-hover:text-neon-magenta",
  violet: "group-hover:shadow-glow-violet group-hover:border-neon-violet/60 group-hover:text-neon-violet",
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-white/[0.06] bg-void-950/60 backdrop-blur-md lg:flex">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-neon-cyan/50 bg-neon-cyan/5 shadow-glow-cyan">
          <Radio className="h-4 w-4 text-neon-cyan" />
        </div>
        <div>
          <p className="font-display text-sm font-bold tracking-wider text-foreground">AGENT<span className="text-neon-cyan">CTRL</span></p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">mission control</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">deck</p>
        <SidebarLink href="/" icon={LayoutDashboard} label="Overview" active={pathname === "/"} />
        <SidebarLink href="/projects" icon={FolderKanban} label="Projects" active={pathname === "/projects"} />
        <SidebarLink href="/journal" icon={BookOpen} label="Journal" active={pathname === "/journal"} />

        <p className="px-3 pb-2 pt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">agents</p>
        {NAV_AGENTS.map((agent) => (
          <Link key={agent.id} href={agent.href} className="group block">
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-all duration-200",
                glowClasses[agent.glow],
                pathname === agent.href && "border-white/10 bg-white/[0.04] text-foreground"
              )}
            >
              <AgentIcon agentId={agent.id} size={18} className="shrink-0 opacity-90" />
              <span className="font-medium">{agent.label}</span>
              {pathname === agent.href && (
                <motion.span
                  layoutId="active-dot"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-neon-cyan shadow-glow-cyan"
                />
              )}
            </div>
          </Link>
        ))}

        <p className="px-3 pb-2 pt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">system</p>
        <SidebarLink href="/diagnostics" icon={Activity} label="Diagnostics" active={pathname === "/diagnostics"} />
        <SidebarLink href="/settings" icon={Settings} label="Settings" active={pathname === "/settings"} />
      </nav>

      <div className="border-t border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-neon-green shadow-glow-green" />
          ALL SYSTEMS NOMINAL
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href} className="block">
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground",
          active && "bg-white/[0.04] text-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="font-medium">{label}</span>
      </div>
    </Link>
  );
}
