"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface DashboardSettings {
  dashboardName: string;
  refreshIntervalSec: number;
  reducedMotion: boolean;
  notifyFailures: boolean;
  notifyDegraded: boolean;
  notifyCompletion: boolean;
  soundAlerts: boolean;
}

const DEFAULT_SETTINGS: DashboardSettings = {
  dashboardName: "AgentCtrl",
  refreshIntervalSec: 5,
  reducedMotion: false,
  notifyFailures: true,
  notifyDegraded: true,
  notifyCompletion: false,
  soundAlerts: false,
};

const STORAGE_KEY = "agentctrl.settings";

interface SettingsContextValue {
  settings: DashboardSettings;
  updateSettings: (patch: Partial<DashboardSettings>) => void;
  hydrated: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {
      // ignore malformed storage, fall back to defaults
    }
    setHydrated(true);
  }, []);

  function updateSettings(patch: Partial<DashboardSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable (private mode, etc) — settings just won't persist
      }
      return next;
    });
  }

  return <SettingsContext.Provider value={{ settings, updateSettings, hydrated }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
