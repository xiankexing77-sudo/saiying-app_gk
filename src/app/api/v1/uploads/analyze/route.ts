import { analyzeSingleText } from "../../../../../../agents/text-evidence";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return Response.json({ message: "需要 JSON。不接受图像二进制。" }, { status: 400 });
  }
  if ("image" in body || "dataUrl" in body || "binary" in body || "file" in body) {
    return Response.json({ message: "不接受图像二进制。作品留在浏览器里。" }, { status: 400 });
  }
  const caption = typeof body.caption === "string" ? body.caption.trim() : "";
  if (!caption) {
    return Response.json({ message: "没有文字说明时，不从像素猜测主体、叙事或主题。" }, { status: 400 });
  }
  if (caption.length > 2000) {
    return Response.json({ message: "说明请短于 2000 字。" }, { status: 400 });
  }
  const analysis = analyzeSingleText({
    id: "analysis-user-caption",
    photographId: "user-local",
    text: caption,
    sourceUrl: null,
    analyzedAt: new Date().toISOString(),
    basis: "user_caption",
  });
  return Response.json({
    kind: "inference",
    pixelsRead: false,
    stored: false,
    message:
      analysis.status === "text_grounded"
        ? "只根据你输入的原句填写了命中的维度。这不是官方事实，也不是比赛预测。"
        : "这段说明没有命中词表。维度保持空白，没有另作发挥。",
    analysis,
  });
}
