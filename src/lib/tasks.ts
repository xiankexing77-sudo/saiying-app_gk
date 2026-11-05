import { connection } from "next/server";
import { settleTask } from "../../agents/settle-task";
import { database } from "./data/seed";
import type { AgentTask, ResearchScope } from "./data/types";

export type ResearchRequest = {
  years: number[];
  scope: ResearchScope;
  forceRefresh: boolean;
};

type Store = { tasks: AgentTask[] };

const globalStore = globalThis as typeof globalThis & { __pjiTaskStore?: Store; __pjiTaskRunning?: Set<string> };

function store() {
  if (!globalStore.__pjiTaskStore) {
    globalStore.__pjiTaskStore = { tasks: structuredClone(database.tasks) };
  }
  return globalStore.__pjiTaskStore;
}

function running() {
  if (!globalStore.__pjiTaskRunning) globalStore.__pjiTaskRunning = new Set();
  return globalStore.__pjiTaskRunning;
}

export async function listTasks() {
  await connection();
  return store().tasks;
}

export async function getTask(id: string) {
  await connection();
  return store().tasks.find((task) => task.id === id) ?? null;
}

export function seedTask(id: string) {
  return database.tasks.find((task) => task.id === id) ?? null;
}

function runStoredTask(id: string) {
  const task = store().tasks.find((item) => item.id === id);
  if (!task || running().has(id)) return task ?? null;
  if (task.status === "succeeded") return task;
  running().add(id);
  task.status = "running";
  task.stage = "进程内执行";
  task.startedAt = task.startedAt ?? new Date().toISOString();
  try {
    const settled = settleTask(task, new Date().toISOString());
    Object.assign(task, settled);
  } finally {
    running().delete(id);
  }
  return task;
}

function schedule(id: string) {
  setTimeout(() => {
    runStoredTask(id);
  }, 40);
}

export async function executeTask(id: string) {
  await connection();
  return runStoredTask(id);
}

export async function createResearchTask(input: ResearchRequest) {
  await connection();
  const years = [...new Set(input.years)].sort();
  if (years.some((year) => year === 2027)) {
    return { ok: false as const, status: 400, message: "2027 没有完整获奖结果，不能创建完整采集任务。" };
  }
  if (years.some((year) => year !== 2025 && year !== 2026)) {
    return { ok: false as const, status: 400, message: "首期只接受 2025 与 2026。" };
  }
  if (years.length === 0) {
    return { ok: false as const, status: 400, message: "至少选择一个届次。" };
  }
  const idempotencyKey = JSON.stringify({ years, scope: input.scope });
  if (!input.forceRefresh) {
    const existing = store().tasks.find((task) => task.idempotencyKey === idempotencyKey);
    if (existing) {
      return { ok: true as const, created: false, task: existing };
    }
  }
  const task: AgentTask = {
    id: `task-research-${Date.now()}`,
    type: "research",
    title: `研究 SWPA ${years.join(" / ")}`,
    status: "queued",
    stage: "已入队",
    total: 8,
    completed: 0,
    failed: 0,
    currentItem: null,
    errorLog: [],
    startedAt: null,
    finishedAt: null,
    idempotencyKey,
    years,
    scope: input.scope,
    stages: [],
  };
  store().tasks = [task, ...store().tasks];
  schedule(task.id);
  return { ok: true as const, created: true, task };
}

export async function retryTask(id: string) {
  await connection();
  const task = store().tasks.find((item) => item.id === id);
  if (!task) return { ok: false as const, status: 404, message: "任务不存在" };
  if (task.status !== "failed" && task.status !== "blocked") {
    return { ok: false as const, status: 409, message: "只有失败或阻塞的任务可以重试", task };
  }
  task.status = "queued";
  task.stage = "已重新入队";
  task.finishedAt = null;
  task.currentItem = null;
  task.errorLog = [...task.errorLog, "已重新入队。进程内会再跑一遍可执行的阶段，不会抓取官网或读取原图。"];
  schedule(task.id);
  return { ok: true as const, task };
}
