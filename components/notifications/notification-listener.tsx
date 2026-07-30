"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getAdapter } from "@/lib/agents/adapter";
import { useSettings } from "@/lib/settings-context";
import { FleetActivityEvent } from "@/types/agents";

/**
 * Polls fleet activity and surfaces toast notifications according to the
 * user's Settings > Notifications preferences. Mounted once in the root
 * layout so it works across every route.
 */
export function NotificationListener() {
  const { settings, hydrated } = useSettings();
  const seen = useRef<Set<string>>(new Set());
  const firstRun = useRef(true);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    async function poll() {
      const events = await getAdapter().getFleetActivity(10);
      if (cancelled) return;

      // On the very first poll, just remember what's already there — don't
      // fire a wall of toasts for pre-existing mock history.
      if (firstRun.current) {
        events.forEach((e) => seen.current.add(e.id));
        firstRun.current = false;
        return;
      }

      const fresh = events.filter((e) => !seen.current.has(e.id));
      fresh.forEach((e) => {
        seen.current.add(e.id);
        maybeNotify(e);
      });
    }

    function maybeNotify(evt: FleetActivityEvent) {
      const shouldNotify =
        (evt.level === "error" && settings.notifyFailures) ||
        (evt.level === "warn" && settings.notifyDegraded) ||
        (evt.level === "info" && settings.notifyCompletion);

      if (!shouldNotify) return;

      const toastFn = evt.level === "error" ? toast.error : evt.level === "warn" ? toast.warning : toast.message;
      toastFn(`${evt.agentId.toUpperCase()} · ${evt.message}`, {
        description: new Date(evt.timestamp).toLocaleTimeString("en-US", { hour12: false }),
      });

      if (settings.soundAlerts && typeof window !== "undefined") {
        playChime();
      }
    }

    poll();
    const interval = setInterval(poll, Math.max(3, settings.refreshIntervalSec) * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, settings.notifyFailures, settings.notifyDegraded, settings.notifyCompletion, settings.soundAlerts, settings.refreshIntervalSec]);

  return null;
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // audio unsupported/blocked — silently ignore
  }
}
