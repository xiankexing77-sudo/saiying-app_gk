import { getJury, juryProfile } from "@/lib/catalog";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!getJury(id)) return Response.json({ message: "没有这位评委" }, { status: 404 });
  const profile = juryProfile(id);
  return Response.json({
    facts: { kind: "fact", ...profile.facts, portfolios: profile.portfolios },
    inference: profile.inference,
  });
}
