"use client";

import { useEffect, useState } from "react";
import { Bell, Menu } from "lucide-react";

export function Topbar() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-neon-cyan/10 bg-void-950/40 px-6 py-4 backdrop-blur-md lg:px-10">
      <div className="flex items-center gap-3">
        <button className="rounded-md border border-neon-cyan/20 p-2 text-muted-foreground lg:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold tracking-wide text-foreground">MISSION CONTROL</h1>
          <p className="font-mono text-[11px] text-muted-foreground">Autonomous agent command deck</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
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
        <button className="relative rounded-md border border-neon-cyan/20 p-2 text-muted-foreground transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-neon-magenta shadow-glow-magenta" />
        </button>
        <div className="h-8 w-8 rounded-full border border-neon-cyan/30 bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20" />
      </div>
    </header>
  );
}
