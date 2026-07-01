import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { isPlayerPinValid } from "@/lib/player-pin";
import { recordPredictionAudit } from "@/lib/prediction-audit";
import { isPredictionLocked } from "@/lib/pool-rules";
import { prisma } from "@/lib/prisma";
import { sendPredictionCreatedMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const predictionSchema = z.object({
  playerId: z.string().min(1),
  gameId: z.string().min(1),
  pin: z.string().trim().min(4),
  brazilGoals: z.coerce.number().int().min(0).max(30),
  opponentGoals: z.coerce.number().int().min(0).max(30)
});

export async function POST(request: Request) {
  try {
    const input = predictionSchema.parse(await readJson(request));
    const [player, game] = await Promise.all([
      prisma.player.findUnique({ where: { id: input.playerId } }),
      prisma.game.findUnique({ where: { id: input.gameId } })
    ]);

    if (!player) {
      return fail("Jogador não encontrado.", 404);
    }

    if (!game) {
      return fail("Jogo não encontrado.", 404);
    }

    if (!isPlayerPinValid(input.pin, player.pinHash)) {
      return fail("Senha de 4 números incorreta para este WhatsApp.", 401);
    }

    if (isPredictionLocked(game)) {
      return fail("Apostas fechadas para este jogo.", 409);
    }

    if (!player.poolId) {
      return fail("Escolha um bolão antes de salvar palpites.", 409);
    }

    if (!game.poolId || game.poolId !== player.poolId) {
      return fail(
        "Este WhatsApp participa de outro bolão e não pode palpitar neste jogo.",
        409
      );
    }

    // Regra central: o mesmo WhatsApp pode carregar varios palpites no mesmo
    // jogo. Cada POST cria uma nova aposta paga e aumenta o prêmio do bolão.
    const prediction = await prisma.prediction.create({
      data: {
        playerId: input.playerId,
        gameId: input.gameId,
        brazilGoals: input.brazilGoals,
        opponentGoals: input.opponentGoals
      }
    });

    await recordPredictionAudit({
      predictionId: prediction.id,
      player,
      game,
      action: "CRIADO",
      previous: null,
      next: {
        brazilGoals: prediction.brazilGoals,
        opponentGoals: prediction.opponentGoals
      }
    });

    const whatsappResult = await sendPredictionCreatedMessage(
      player,
      game,
      prediction
    );

    return ok({
      prediction,
      whatsappWarning: whatsappResult.warning ?? null
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro ao salvar palpite.", 400);
  }
}
