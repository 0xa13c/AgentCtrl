"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Incorrect password");
        setLoading(false);
        return;
      }
      router.push(params.get("next") || "/");
      router.refresh();
    } catch {
      setError("Could not reach the server");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-void-950 px-4">
      <div className="absolute inset-0 bg-hud-grid bg-grid opacity-[0.12] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black_30%,transparent_100%)]" />
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="hud-panel relative z-10 w-full max-w-sm p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 shadow-glow-cyan">
            <Lock className="h-5 w-5 text-neon-cyan" />
          </div>
          <p className="font-display text-lg font-bold tracking-wide text-foreground">AGENTCTRL</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">restricted access</p>
        </div>

        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Password</label>
        <Input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-white/10 bg-black/30 font-mono"
        />
        {error && <p className="mt-2 text-xs text-neon-red">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-neon-cyan/40 bg-neon-cyan/10 py-2.5 text-sm font-semibold text-neon-cyan transition-all hover:shadow-glow-cyan disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter"}
        </button>
      </motion.form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
