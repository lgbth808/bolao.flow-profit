import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { getOpponentFlag } from "@/lib/flags";
import { normalizeCurrencyInput } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { finalizeGamePrizeSnapshot } from "@/lib/prize";
import { sendNewGameMessageToPlayers } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const DEFAULT_PREDICTION_RULE =
  "Vale apenas para palpites de 1º e 2º tempos.";

const gameSchema = z.object({
  poolId: z.string().trim().optional(),
  opponent: z.string().trim().min(2),
  phase: z.string().trim().min(2),
  kickoffAt: z.string().trim().min(1),
  valorBolao: z.union([z.string(), z.number()]).optional(),
  scoreSourceUrl: z.string().trim().optional(),
  apiFootballFixtureId: z.string().trim().optional(),
  predictionRule: z
    .string()
    .trim()
    .min(2)
    .default(DEFAULT_PREDICTION_RULE),
  status: z.enum(["ABERTO", "ENCERRADO"]).default("ABERTO"),
  brazilScore: z.coerce.number().int().min(0).max(30).nullable().optional(),
  opponentScore: z.coerce.number().int().min(0).max(30).nullable().optional(),
  hidePredictionsUntilLocked: z.boolean().default(true)
});

function normalizeScoreSourceUrl(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const url = new URL(trimmed);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("A URL/API do placar deve usar http ou https.");
  }

  return url.toString();
}

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export async function POST(request: Request) {
  try {
    const input = gameSchema.parse(await readJson(request));
    const kickoffAt = new Date(input.kickoffAt);

    if (Number.isNaN(kickoffAt.getTime())) {
      return fail("Data/hora do jogo inválida.", 400);
    }

    let game = await prisma.game.create({
      data: {
        poolId: normalizeOptionalText(input.poolId),
        opponent: input.opponent,
        opponentFlag: getOpponentFlag(input.opponent),
        phase: input.phase,
        kickoffAt,
        valorBolao: normalizeCurrencyInput(input.valorBolao),
        scoreSourceUrl: normalizeScoreSourceUrl(input.scoreSourceUrl),
        apiFootballFixtureId: normalizeOptionalText(input.apiFootballFixtureId),
        predictionRule: input.predictionRule,
        status: input.status,
        brazilScore: input.brazilScore ?? 0,
        opponentScore: input.opponentScore ?? 0,
        finishedAt: input.status === "ENCERRADO" ? new Date() : null,
        hidePredictionsUntilLocked: input.hidePredictionsUntilLocked
      }
    });

    if (game.finishedAt) {
      await finalizeGamePrizeSnapshot(game.id, game.finishedAt);
    }

    const whatsappResult = await sendNewGameMessageToPlayers(game);

    return ok(
      {
        game,
        whatsappWarning: whatsappResult.warning ?? null
      },
      201
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro ao cadastrar jogo.", 400);
  }
}
