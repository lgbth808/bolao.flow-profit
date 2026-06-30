import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type FinalizedWinnerSnapshot = {
  playerId: string;
  name: string;
  whatsapp: string;
  predictionLabel: string;
};

export function parseFinalizedWinners(
  value: string | null | undefined
): FinalizedWinnerSnapshot[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as FinalizedWinnerSnapshot[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (winner) =>
        typeof winner.playerId === "string" &&
        typeof winner.name === "string" &&
        typeof winner.whatsapp === "string" &&
        typeof winner.predictionLabel === "string"
    );
  } catch {
    return [];
  }
}

export const clearFinalPrizeSnapshotData = {
  finalizedPrizeAmount: null,
  finalizedWinningQuotaCount: null,
  finalizedWinningShareAmount: null,
  finalizedWinningScoreLabel: null,
  finalizedWinnersJson: null,
  prizeFinalizedAt: null
};

export async function buildFinalPrizeSnapshotData(
  gameId: string,
  prizeFinalizedAt = new Date()
) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      predictions: {
        include: {
          player: true
        }
      }
    }
  });

  if (!game) {
    throw new Error("Jogo não encontrado para cravar o prêmio.");
  }

  const brazilScore = game.brazilScore ?? 0;
  const opponentScore = game.opponentScore ?? 0;
  const paidPredictions = game.predictions.filter((prediction) => prediction.paidAt);
  const prizeAmount = new Prisma.Decimal(game.valorBolao).mul(
    paidPredictions.length
  );
  const winnersByWhatsapp = new Map<string, FinalizedWinnerSnapshot>();

  // Regra financeira central: no encerramento, o rateio é cravado por WhatsApp.
  // Se o mesmo número acertar mais de uma vez no mesmo jogo, conta uma cota.
  for (const prediction of paidPredictions) {
    if (
      prediction.brazilGoals === brazilScore &&
      prediction.opponentGoals === opponentScore &&
      !winnersByWhatsapp.has(prediction.player.whatsapp)
    ) {
      winnersByWhatsapp.set(prediction.player.whatsapp, {
        playerId: prediction.playerId,
        name: prediction.player.name,
        whatsapp: prediction.player.whatsapp,
        predictionLabel: `${prediction.brazilGoals} x ${prediction.opponentGoals}`
      });
    }
  }

  const winners = Array.from(winnersByWhatsapp.values());
  const shareAmount =
    winners.length > 0 ? prizeAmount.div(winners.length) : null;

  return {
    finalizedPrizeAmount: prizeAmount,
    finalizedWinningQuotaCount: winners.length,
    finalizedWinningShareAmount: shareAmount,
    finalizedWinningScoreLabel: `${brazilScore} x ${opponentScore}`,
    finalizedWinnersJson: JSON.stringify(winners),
    prizeFinalizedAt
  };
}

export async function finalizeGamePrizeSnapshot(
  gameId: string,
  prizeFinalizedAt = new Date()
) {
  const data = await buildFinalPrizeSnapshotData(gameId, prizeFinalizedAt);

  return prisma.game.update({
    where: { id: gameId },
    data
  });
}
