import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { isPlayerPinValid } from "@/lib/player-pin";
import { recordPredictionAudit } from "@/lib/prediction-audit";
import { isPredictionLocked } from "@/lib/pool-rules";
import { prisma } from "@/lib/prisma";
import {
  sendPredictionDeletedMessage,
  sendPredictionUpdatedMessage
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const predictionUpdateSchema = z.object({
  playerId: z.string().min(1),
  pin: z.string().trim().min(4),
  brazilGoals: z.coerce.number().int().min(0).max(30),
  opponentGoals: z.coerce.number().int().min(0).max(30)
});

const predictionDeleteSchema = z.object({
  playerId: z.string().min(1),
  pin: z.string().trim().min(4)
});

async function loadPrediction(predictionId: string, playerId: string) {
  const prediction = await prisma.prediction.findUnique({
    where: { id: predictionId },
    include: { player: true, game: true }
  });

  if (!prediction || prediction.playerId !== playerId) {
    return null;
  }

  return prediction;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const input = predictionUpdateSchema.parse(await readJson(request));
    const prediction = await loadPrediction(params.id, input.playerId);

    if (!prediction) {
      return fail("Palpite não encontrado para este jogador.", 404);
    }

    if (!isPlayerPinValid(input.pin, prediction.player.pinHash)) {
      return fail("Senha de 4 números incorreta para este WhatsApp.", 401);
    }

    if (isPredictionLocked(prediction.game)) {
      return fail("Apostas fechadas para este jogo.", 409);
    }

    if (!prediction.player.poolId || prediction.player.poolId !== prediction.game.poolId) {
      return fail(
        "Este WhatsApp participa de outro bolão e não pode editar este palpite.",
        409
      );
    }

    const updated = await prisma.prediction.update({
      where: { id: params.id },
      data: {
        brazilGoals: input.brazilGoals,
        opponentGoals: input.opponentGoals
      }
    });

    await recordPredictionAudit({
      predictionId: updated.id,
      player: prediction.player,
      game: prediction.game,
      action: "EDITADO",
      previous: {
        brazilGoals: prediction.brazilGoals,
        opponentGoals: prediction.opponentGoals
      },
      next: {
        brazilGoals: updated.brazilGoals,
        opponentGoals: updated.opponentGoals
      }
    });

    const whatsappResult = await sendPredictionUpdatedMessage(
      prediction.player,
      prediction.game,
      updated
    );

    return ok({ prediction: updated, whatsappWarning: whatsappResult.warning ?? null });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao atualizar palpite.",
      400
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const input = predictionDeleteSchema.parse(await readJson(request));
    const prediction = await loadPrediction(params.id, input.playerId);

    if (!prediction) {
      return fail("Palpite não encontrado para este jogador.", 404);
    }

    if (!isPlayerPinValid(input.pin, prediction.player.pinHash)) {
      return fail("Senha de 4 números incorreta para este WhatsApp.", 401);
    }

    if (isPredictionLocked(prediction.game)) {
      return fail("Apostas fechadas para este jogo.", 409);
    }

    if (!prediction.player.poolId || prediction.player.poolId !== prediction.game.poolId) {
      return fail(
        "Este WhatsApp participa de outro bolão e não pode excluir este palpite.",
        409
      );
    }

    await prisma.prediction.delete({
      where: { id: params.id }
    });

    await recordPredictionAudit({
      predictionId: prediction.id,
      player: prediction.player,
      game: prediction.game,
      action: "EXCLUIDO",
      previous: {
        brazilGoals: prediction.brazilGoals,
        opponentGoals: prediction.opponentGoals
      },
      next: null
    });

    const whatsappResult = await sendPredictionDeletedMessage(
      prediction.player,
      prediction.game
    );

    return ok({ deleted: true, whatsappWarning: whatsappResult.warning ?? null });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao excluir palpite.",
      400
    );
  }
}
