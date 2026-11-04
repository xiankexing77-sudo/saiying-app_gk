import type { AgentTask } from "../src/lib/data/types";
import { textEvidenceCounts } from "../src/lib/catalog";
import { runScopedGraph } from "./graph";

function blockedPixels(task: AgentTask, startedAt: string, now: string): AgentTask {
  const text = textEvidenceCounts();
  const summary = `像素分析阻塞：原图 rights_blocked，未保存二进制，VISION_MODEL 未配置。文本证据另计 ${text.grounded} 条命中、${text.insufficient} 条留空，不代替看图。`;
  return {
    ...task,
    status: "blocked",
    stage: "像素分析阻塞",
    total: text.grounded + text.insufficient,
    completed: 0,
    failed: text.grounded + text.insufficient,
    currentItem: null,
    errorLog: [summary, "重试只会再次确认原图不可用，不会抓取图片。"],
    startedAt,
    finishedAt: now,
    stages: [{ stage: "image_analysis", status: "blocked", summary }],
  };
}

/** 把已入队的任务结算成可查询状态。不发 HTTP，不读像素。 */
export function settleTask(task: AgentTask, now: string): AgentTask {
  const startedAt = task.startedAt ?? now;
  if (task.type === "analyze") return blockedPixels(task, startedAt, now);
  if (task.type === "research" && task.scope) {
    const graph = runScopedGraph({ years: task.years, scope: task.scope });
    const blocked = graph.nodes.filter((node) => node.status === "blocked");
    const hard = blocked.filter((node) => node.stage !== "image_analysis");
    return {
      ...task,
      status: hard.length ? "blocked" : "succeeded",
      stage: hard.length ? "有请求范围无法执行" : "可运行的阶段已结束。像素分析仍阻塞。",
      total: graph.nodes.length,
      completed: graph.nodes.filter((node) => node.status === "passed").length,
      failed: blocked.length,
      currentItem: null,
      errorLog: blocked.map((node) => node.summary),
      startedAt,
      finishedAt: now,
      stages: graph.nodes.map((node) => ({ stage: node.stage, status: node.status, summary: node.summary })),
    };
  }
  return {
    ...task,
    status: "blocked",
    stage: "这个任务不会重新抓取官网",
    startedAt,
    finishedAt: now,
    currentItem: null,
    errorLog: [...task.errorLog, "种子里的采集或报告任务不在请求里重跑，也不访问网络。"],
    stages: [{ stage: "collection", status: "blocked", summary: "未访问网络。" }],
  };
}
