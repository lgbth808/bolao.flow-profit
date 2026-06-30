import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { searchApiFootballTeams } from "@/lib/score-sync";

export const dynamic = "force-dynamic";

const teamSearchSchema = z.object({
  search: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  code: z.string().trim().optional().or(z.literal(""))
});

export async function POST(request: Request) {
  try {
    const input = teamSearchSchema.parse(await readJson(request));
    const teams = await searchApiFootballTeams({
      search: input.search || undefined,
      country: input.country || undefined,
      code: input.code || undefined
    });

    return ok({ teams });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao buscar times na API-Football.",
      400
    );
  }
}
