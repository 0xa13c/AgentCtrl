"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { AgentId } from "@/types/agents";

const POLL_MS = 1000;

export interface LiveTerminalHandle {
  clear: () => void;
}

export const LiveTerminal = forwardRef<LiveTerminalHandle, { agentId: AgentId }>(function LiveTerminal({ agentId }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const cursorRef = useRef(0);

  useImperativeHandle(ref, () => ({
    clear: () => termRef.current?.clear(),
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      convertEol: true,
      fontFamily: "var(--font-mono), monospace",
      fontSize: 13,
      theme: {
        background: "#03050a",
        foreground: "#c8f4ff",
        cursor: "#00f0ff",
        selectionBackground: "#00f0ff33",
      },
      disableStdin: true, // this pane is read-only display; typed input goes through the composer, not direct keystrokes
      scrollback: 5000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    term.writeln(`\x1b[90m# connecting to ${agentId}'s terminal stream...\x1b[0m`);

    termRef.current = term;
    cursorRef.current = 0;

    const resizeObserver = new ResizeObserver(() => fit.fit());
    resizeObserver.observe(containerRef.current);

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/terminal/${agentId}/output?cursor=${cursorRef.current}&limit=500`);
        const data = await res.json();
        if (cancelled) return;
        for (const chunk of data.chunks) {
          term.write(chunk);
        }
        cursorRef.current = data.cursor;
      } catch {
        // transient network hiccup — next poll will retry
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      resizeObserver.disconnect();
      term.dispose();
      termRef.current = null;
    };
  }, [agentId]);

  return <div ref={containerRef} className="h-full w-full" />;
});
