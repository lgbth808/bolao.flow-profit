import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { getOpponentFlag } from "@/lib/flags";
import { normalizeCurrencyInput } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import {
  clearFinalPrizeSnapshotData,
  finalizeGamePrizeSnapshot
} from "@/lib/prize";

export const dynamic = "force-dynamic";

const gameUpdateSchema = z.object({
  poolId: z.string().trim().optional(),
  opponent: z.string().trim().min(2).optional(),
  phase: z.string().trim().min(2).optional(),
  kickoffAt: z.string().trim().min(1).optional(),
  valorBolao: z.union([z.string(), z.number()]).optional(),
  scoreSourceUrl: z.string().trim().optional(),
  apiFootballFixtureId: z.string().trim().optional(),
  predictionRule: z.string().trim().min(2).optional(),
  status: z.enum(["ABERTO", "ENCERRADO"]).optional(),
  brazilScore: z.coerce.number().int().min(0).max(30).nullable().optional(),
  opponentScore: z.coerce.number().int().min(0).max(30).nullable().optional(),
  hidePredictionsUntilLocked: z.boolean().optional()
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const input = gameUpdateSchema.parse(await readJson(request));
    const data = {
      ...input,
      opponentFlag: input.opponent ? getOpponentFlag(input.opponent) : undefined,
      kickoffAt: input.kickoffAt ? new Date(input.kickoffAt) : undefined,
      valorBolao:
        input.valorBolao === undefined
          ? undefined
          : normalizeCurrencyInput(input.valorBolao),
      poolId:
        input.poolId === undefined ? undefined : normalizeOptionalText(input.poolId),
      apiFootballFixtureId:
        input.apiFootballFixtureId === undefined
          ? undefined
          : normalizeOptionalText(input.apiFootballFixtureId),
      scoreSourceUrl:
        input.scoreSourceUrl === undefined
          ? undefined
          : normalizeScoreSourceUrl(input.scoreSourceUrl),
      finishedAt:
        input.status === undefined
          ? undefined
          : input.status === "ENCERRADO"
            ? new Date()
            : null
    };

    if (data.kickoffAt && Number.isNaN(data.kickoffAt.getTime())) {
      return fail("Data/hora do jogo inválida.", 400);
    }

    let game = await prisma.game.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(input.status === "ABERTO" ? clearFinalPrizeSnapshotData : {})
      }
    });

    if (game.finishedAt) {
      await finalizeGamePrizeSnapshot(game.id, game.finishedAt);
    }

    return ok({ game });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro ao editar jogo.", 400);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.game.delete({
      where: { id: params.id }
    });

    return ok({ deleted: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro ao excluir jogo.", 400);
  }
}
