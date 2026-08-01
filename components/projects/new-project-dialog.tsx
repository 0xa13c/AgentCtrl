"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Project } from "@/types/projects";

export function NewProjectDialog({ onCreated }: { onCreated: (project: Project) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, goal, description }),
      });
      if (res.ok) {
        onCreated(await res.json());
        setName("");
        setGoal("");
        setDescription("");
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded-md border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-2 text-sm font-semibold text-neon-cyan transition-all hover:shadow-glow-cyan">
          <Plus className="h-4 w-4" /> New Project
        </button>
      </DialogTrigger>
      <DialogContent className="border-neon-cyan/20 bg-void-900 text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display">New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Migrate CI to Buildkite" className="border-white/10 bg-black/30" />
          </div>
          <div>
            <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Goal</Label>
            <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What does done look like?" className="border-white/10 bg-black/30" />
          </div>
          <div>
            <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="border-white/10 bg-black/30" rows={3} />
          </div>
          <button
            onClick={submit}
            disabled={saving || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-neon-cyan/40 bg-neon-cyan/10 py-2.5 text-sm font-semibold text-neon-cyan transition-all hover:shadow-glow-cyan disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
