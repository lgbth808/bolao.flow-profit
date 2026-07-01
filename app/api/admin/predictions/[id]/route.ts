import { fail, ok } from "@/lib/api";
import { recordPredictionAudit } from "@/lib/prediction-audit";
import { prisma } from "@/lib/prisma";
import { sendPredictionAdminDeletedMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prediction = await prisma.prediction.findUnique({
      where: { id: params.id },
      include: { player: true, game: true }
    });

    if (!prediction) {
      return fail("Palpite não encontrado.", 404);
    }

    await prisma.prediction.delete({
      where: { id: params.id }
    });

    await recordPredictionAudit({
      predictionId: prediction.id,
      player: prediction.player,
      game: prediction.game,
      action: "EXCLUIDO_ADMIN",
      previous: {
        brazilGoals: prediction.brazilGoals,
        opponentGoals: prediction.opponentGoals
      },
      next: null
    });

    const whatsappResult = await sendPredictionAdminDeletedMessage(
      prediction.player,
      prediction.game
    );

    return ok({
      deleted: true,
      whatsappWarning: whatsappResult.warning ?? null
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao excluir palpite.",
      400
    );
  }
}
