import { rebuildAnalysis } from "@/lib/catalog";
import type { AnalysisResult } from "@/lib/types";

export async function POST(request: Request) {
  let body: {
    target_type?: AnalysisResult["target_type"];
    target_id?: string;
    kind?: AnalysisResult["kind"];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "无法读取请求" }, { status: 400 });
  }
  if (!body.target_type || !body.target_id || !body.kind) {
    return Response.json({ error: "缺少目标" }, { status: 400 });
  }
  const result = rebuildAnalysis(body.target_type, body.target_id, body.kind);
  if (result.status === "failed") {
    return Response.json(result, { status: 404 });
  }
  return Response.json(result);
}
