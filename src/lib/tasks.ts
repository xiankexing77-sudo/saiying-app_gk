import { connection } from "next/server";
import { settleTask } from "../../agents/settle-task";
import { runStageB } from "./stage-b/report";
import { database } from "./data/seed";
import type { AgentTask, ResearchScope } from "./data/types";

export type ResearchRequest = {
  years: number[];
  scope: ResearchScope;
  forceRefresh: boolean;
};

type Store = { tasks: AgentTask[] };

const globalStore = globalThis as typeof globalThis & {
  __pjiTaskStore?: Store;
  __pjiTaskRunning?: Set<string>;
  __pjiTaskPending?: Map<string, Promise<AgentTask | null>>;
};

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

function pending() {
  if (!globalStore.__pjiTaskPending) globalStore.__pjiTaskPending = new Map();
  return globalStore.__pjiTaskPending;
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
  const existing = pending().get(id);
  if (existing) return existing;
  const task = store().tasks.find((item) => item.id === id);
  if (!task || task.status === "succeeded") return Promise.resolve(task ?? null);
  const job = (async () => {
    running().add(id);
    task.status = "running";
    task.stage = task.type === "stage_b" ? "阶段 B 执行" : "进程内执行";
    task.startedAt = task.startedAt ?? new Date().toISOString();
    const now = new Date().toISOString();
    try {
      if (task.type === "stage_b") {
        const settled = await runStageB({
          years: task.years,
          now,
          force: false,
          injectFailureWorkId: task.stageB?.injectFailureWorkId ?? null,
        });
        task.status = settled.status;
        task.stage = settled.stage;
        task.total = settled.total;
        task.completed = settled.completed;
        task.failed = settled.failed;
        task.currentItem = settled.currentItem;
        task.errorLog = settled.errorLog;
        task.stages = settled.stages;
      } else {
        Object.assign(task, settleTask(task, now));
      }
    } catch (error) {
      task.status = "failed";
      task.stage = "执行失败";
      task.currentItem = task.currentItem ?? null;
      task.failed += 1;
      task.errorLog = [...task.errorLog, error instanceof Error ? error.message : "任务执行失败"];
      task.stages = [...task.stages, { stage: "run", status: "failed", summary: task.errorLog.at(-1) ?? "任务执行失败" }];
    } finally {
      task.finishedAt = new Date().toISOString();
      running().delete(id);
      pending().delete(id);
    }
    return task;
  })();
  pending().set(id, job);
  return job;
}

function schedule(id: string) {
  setTimeout(() => {
    void runStoredTask(id);
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

export async function createStageBTask(input: { years: number[]; forceRefresh?: boolean; injectFailureWorkId?: string | null }) {
  await connection();
  const years = [...new Set(input.years)].sort();
  if (years.some((year) => year === 2027)) {
    return { ok: false as const, status: 400, message: "2027 没有完整获奖结果，不能创建阶段 B 任务。" };
  }
  if (years.some((year) => year !== 2025 && year !== 2026)) {
    return { ok: false as const, status: 400, message: "阶段 B 只接受 2025 与 2026。" };
  }
  if (years.length === 0) {
    return { ok: false as const, status: 400, message: "至少选择一个届次。" };
  }
  const injectFailureWorkId = input.injectFailureWorkId?.trim() || null;
  const idempotencyKey = JSON.stringify({ stageB: true, years, injectFailureWorkId });
  if (!input.forceRefresh) {
    const existing = store().tasks.find((task) => task.idempotencyKey === idempotencyKey);
    if (existing) return { ok: true as const, created: false, task: existing };
  }
  const task: AgentTask = {
    id: `task-stage-b-${Date.now()}`,
    type: "stage_b",
    title: `阶段 B 获奖与评委草稿 ${years.join(" / ")}`,
    status: "queued",
    stage: "已入队",
    total: 6,
    completed: 0,
    failed: 0,
    currentItem: null,
    errorLog: [],
    startedAt: null,
    finishedAt: null,
    idempotencyKey,
    years,
    scope: {
      winners: true,
      shortlists: false,
      juries: true,
      juryPortfolios: false,
      imageAnalysis: true,
      reportGeneration: true,
    },
    stages: [],
    stageB: { injectFailureWorkId },
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
  if (task.type === "stage_b" && task.stageB) task.stageB = { injectFailureWorkId: null };
  const note =
    task.type === "stage_b"
      ? "已重新入队。会按 fixture 里的官方图像 URL 再下载，并只把带有来源 URL 和下载时间的缓存送进视觉读取。"
      : "已重新入队。进程内会再跑一遍可执行的阶段，不会抓取官网或读取原图。";
  task.errorLog = [...task.errorLog, note];
  schedule(task.id);
  return { ok: true as const, task, message: note };
}
