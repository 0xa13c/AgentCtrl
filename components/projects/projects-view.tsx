"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FolderKanban } from "lucide-react";
import { Project } from "@/types/projects";
import { Skeleton } from "@/components/ui/skeleton";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ProjectStatusPill } from "@/components/projects/status-pill";
import { AgentAssignChips } from "@/components/projects/agent-assign-chips";
import { AgentId } from "@/types/agents";

function uniqueAssignedAgents(project: Project): AgentId[] {
  const set = new Set<AgentId>();
  project.tasks.forEach((t) => t.assignedAgentIds.forEach((a) => set.add(a)));
  return Array.from(set);
}

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then(setProjects);
  }, []);

  function handleCreated(project: Project) {
    router.push(`/projects/${project.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">mission planning</p>
          <h1 className="font-display text-2xl font-black tracking-wide text-foreground">PROJECTS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Goals, tasks, and which agents are assigned to each one.</p>
        </div>
        <NewProjectDialog onCreated={handleCreated} />
      </div>

      {!projects && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {projects && projects.length === 0 && (
        <div className="hud-panel flex flex-col items-center gap-3 p-12 text-center">
          <FolderKanban className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No projects yet — create one to start assigning tasks to your agents.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project, i) => {
          const done = project.tasks.filter((t) => t.status === "done").length;
          const total = project.tasks.length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          const agents = uniqueAssignedAgents(project);

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
            >
              <Link href={`/projects/${project.id}`} className="block h-full text-left">
                <div className="hud-card h-full p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="font-display text-base font-bold text-foreground">{project.name}</p>
                    <ProjectStatusPill status={project.status} />
                  </div>
                  {project.goal && <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{project.goal}</p>}

                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                      <span>
                        {done}/{total} tasks
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-neon-cyan shadow-glow-cyan transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {agents.length > 0 && <AgentAssignChips selected={agents} interactive={false} />}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
