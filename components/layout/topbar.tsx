"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useSidebarState } from "@/lib/sidebar-context";
import { NotificationBell } from "@/components/layout/notification-bell";

export function Topbar() {
  const [time, setTime] = useState<Date | null>(null);
  const { toggle } = useSidebarState();

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-neon-cyan/10 bg-void-950/40 px-4 py-4 backdrop-blur-md min-[800px]:px-10">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="rounded-md border border-neon-cyan/20 p-2 text-muted-foreground transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan min-[600px]:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-base font-bold tracking-wide text-foreground min-[600px]:text-lg">MISSION CONTROL</h1>
          <p className="hidden font-mono text-[11px] text-muted-foreground min-[600px]:block">Autonomous agent command deck</p>
        </div>
      </div>

      <div className="flex items-center gap-3 min-[600px]:gap-6">
        <div className="hidden font-mono text-xs text-muted-foreground sm:block">
          {time ? (
            <>
              <span className="text-neon-cyan">{time.toLocaleTimeString("en-US", { hour12: false })}</span>{" "}
              <span className="opacity-60">{time.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}</span>
            </>
          ) : (
            <span className="opacity-40">--:--:--</span>
          )}
        </div>
        <NotificationBell />
        <div className="h-8 w-8 rounded-full border border-neon-cyan/30 bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20" />
      </div>
    </header>
  );
}
