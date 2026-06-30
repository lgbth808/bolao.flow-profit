import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { syncEligibleGameScores, syncGameScoreById } from "@/lib/score-sync";

export const dynamic = "force-dynamic";

const syncSchema = z.object({
  gameId: z.string().min(1).optional(),
  force: z.boolean().optional().default(false)
});

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const input = syncSchema.parse(body ? JSON.parse(body) : {});

    if (input.gameId) {
      return ok({
        results: [
          await syncGameScoreById(input.gameId, {
            ignoreInterval: true,
            allowFinalized: true
          })
        ]
      });
    }

    return ok({
      results: await syncEligibleGameScores({
        ignoreInterval: input.force,
        allowFinalized: input.force
      })
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao sincronizar placar.",
      400
    );
  }
}
