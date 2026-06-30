import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { searchApiFootballFixtures } from "@/lib/score-sync";

export const dynamic = "force-dynamic";

const fixtureSearchSchema = z.object({
  leagueId: z.string().trim().regex(/^\d+$/, "league precisa ser ID numérico."),
  season: z.string().trim().regex(/^\d{4}$/, "season deve ter 4 dígitos."),
  teamId: z.string().trim().regex(/^\d+$/, "team precisa ser ID numérico."),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date deve estar em YYYY-MM-DD.")
    .optional()
    .or(z.literal(""))
});

export async function POST(request: Request) {
  try {
    const input = fixtureSearchSchema.parse(await readJson(request));
    const fixtures = await searchApiFootballFixtures({
      leagueId: input.leagueId,
      season: input.season,
      teamId: input.teamId,
      date: input.date || undefined
    });

    return ok({ fixtures });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao buscar jogos na API-Football.",
      400
    );
  }
}
