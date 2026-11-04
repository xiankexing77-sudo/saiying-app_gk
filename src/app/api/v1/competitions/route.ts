import { getCompetition, listEditions } from "@/lib/catalog";

export function GET() {
  const competition = getCompetition();
  return Response.json({ competitions: [{ ...competition, editions: listEditions() }] });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: string; name?: string } | null;
  if (body?.id && body.id !== "swpa") {
    return Response.json(
      { message: "首期只登记 SWPA。未核验的赛事不入库，也不用模型补写事实。" },
      { status: 400 },
    );
  }
  if (body?.name && body.name !== "Sony World Photography Awards" && body.name !== "SWPA") {
    return Response.json(
      { message: "首期只登记 Sony World Photography Awards。其他名称不入库。" },
      { status: 400 },
    );
  }
  return Response.json({
    created: false,
    competition: getCompetition(),
    message: "SWPA 已在种子中。这个接口不新建赛事，也不覆盖已核对记录。",
  });
}
