import { getRedisClient } from "@/lib/redis";
import { CreateProjectInput, CreateTaskInput, Project, ProjectTask, TaskStatus } from "@/types/projects";

/**
 * Server-only Redis-backed project store. Each project (with its tasks
 * embedded) is one JSON blob — plenty for personal/small-team project
 * volumes. If this ever needs to scale to hundreds of projects with heavy
 * concurrent task updates, split tasks into their own keys; not worth the
 * complexity at this scale today.
 */
const INDEX_KEY = "agentctrl:projects:index";
const projectKey = (id: string) => `agentctrl:projects:${id}`;

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function listProjects(): Promise<Project[]> {
  const redis = getRedisClient();
  const ids = await redis.smembers(INDEX_KEY);
  if (!ids.length) return [];
  const raw = await redis.mget(ids.map(projectKey));
  return raw
    .filter((r): r is string => Boolean(r))
    .map((r) => JSON.parse(r) as Project)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProject(id: string): Promise<Project | null> {
  const raw = await getRedisClient().get(projectKey(id));
  return raw ? (JSON.parse(raw) as Project) : null;
}

async function saveProject(project: Project) {
  await getRedisClient().set(projectKey(project.id), JSON.stringify(project));
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    id: newId("proj"),
    name: input.name,
    description: input.description ?? "",
    goal: input.goal ?? "",
    status: "planning",
    createdAt: now,
    updatedAt: now,
    tasks: [],
  };
  const redis = getRedisClient();
  await redis.sadd(INDEX_KEY, project.id);
  await saveProject(project);
  return project;
}

export async function updateProject(id: string, patch: Partial<Pick<Project, "name" | "description" | "goal" | "status">>): Promise<Project | null> {
  const project = await getProject(id);
  if (!project) return null;
  const updated: Project = { ...project, ...patch, updatedAt: new Date().toISOString() };
  await saveProject(updated);
  return updated;
}

export async function deleteProject(id: string): Promise<boolean> {
  const redis = getRedisClient();
  const existed = await redis.exists(projectKey(id));
  await redis.srem(INDEX_KEY, id);
  await redis.del(projectKey(id));
  return existed === 1;
}

export async function addTask(projectId: string, input: CreateTaskInput): Promise<Project | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  const now = new Date().toISOString();
  const task: ProjectTask = {
    id: newId("task"),
    title: input.title,
    description: input.description ?? "",
    status: "todo",
    assignedAgentIds: input.assignedAgentIds ?? [],
    createdAt: now,
    updatedAt: now,
  };
  project.tasks.push(task);
  project.updatedAt = now;
  await saveProject(project);
  return project;
}

export async function updateTask(
  projectId: string,
  taskId: string,
  patch: Partial<Pick<ProjectTask, "title" | "description" | "status" | "assignedAgentIds">>
): Promise<Project | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  const idx = project.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  project.tasks[idx] = { ...project.tasks[idx], ...patch, updatedAt: now };
  project.updatedAt = now;
  await saveProject(project);
  return project;
}

export async function deleteTask(projectId: string, taskId: string): Promise<Project | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  project.tasks = project.tasks.filter((t) => t.id !== taskId);
  project.updatedAt = new Date().toISOString();
  await saveProject(project);
  return project;
}

export function taskProgress(tasks: ProjectTask[]): { done: number; total: number } {
  return { done: tasks.filter((t) => t.status === ("done" as TaskStatus)).length, total: tasks.length };
}
