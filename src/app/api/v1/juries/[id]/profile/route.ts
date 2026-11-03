import { getJury, juryProfile } from "@/lib/catalog";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!getJury(id)) return Response.json({ message: "没有这位评委" }, { status: 404 });
  const profile = juryProfile(id);
  const works = profile.personalWorks;
  return Response.json({
    facts: { kind: "fact", ...profile.facts, portfolios: profile.portfolios },
    personalWorks: works
      ? {
          kind: "fact",
          requiredGroups: works.requiredGroups,
          groupCount: works.groups.length,
          network: works.network,
          collectionMode: works.collectionMode,
          groups: works.groups,
          rejected: works.rejected,
          runs: works.runs,
        }
      : null,
    inference: profile.inference,
  });
}
