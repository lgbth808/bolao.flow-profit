import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { searchApiFootballLeagues } from "@/lib/score-sync";

export const dynamic = "force-dynamic";

const leagueSearchSchema = z.object({
  search: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  season: z.string().trim().optional().or(z.literal("")),
  current: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const input = leagueSearchSchema.parse(await readJson(request));
    const leagues = await searchApiFootballLeagues({
      search: input.search || undefined,
      country: input.country || undefined,
      season: input.season || undefined,
      current: input.current
    });

    return ok({ leagues });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao buscar ligas na API-Football.",
      400
    );
  }
}
