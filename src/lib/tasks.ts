import { connection } from "next/server";
import { database } from "./data/seed";
import type { AgentTask } from "./data/types";

export type ResearchRequest = {
  years: number[];
  scope: {
    winners: boolean;
    shortlists: boolean;
    juries: boolean;
    juryPortfolios: boolean;
    imageAnalysis: boolean;
    reportGeneration: boolean;
  };
  forceRefresh: boolean;
};

type Store = { tasks: AgentTask[] };

const globalStore = globalThis as typeof globalThis & { __pjiTaskStore?: Store };

function store() {
  if (!globalStore.__pjiTaskStore) {
    globalStore.__pjiTaskStore = { tasks: structuredClone(database.tasks) };
  }
  return globalStore.__pjiTaskStore;
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
    stage: "已入队，等待 worker",
    total: years.length,
    completed: 0,
    failed: 0,
    currentItem: null,
    errorLog: ["HTTP 请求只创建任务。本 POC 没有 Celery / LangGraph 运行时，不会在请求里同步抓取或调用模型。"],
    startedAt: null,
    finishedAt: null,
    idempotencyKey,
  };
  store().tasks = [task, ...store().tasks];
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
  task.errorLog = [
    ...task.errorLog,
    "重试只把状态改回队列。没有 worker 会继续抓取页面或分析图像。",
  ];
  return { ok: true as const, task };
}
