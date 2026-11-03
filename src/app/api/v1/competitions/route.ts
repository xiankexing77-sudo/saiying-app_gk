import { getCompetition, listEditions } from "@/lib/catalog";

export function GET() {
  const competition = getCompetition();
  return Response.json({ competitions: [{ ...competition, editions: listEditions() }] });
}
