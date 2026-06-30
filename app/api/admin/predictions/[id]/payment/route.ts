import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { sendPredictionPaidMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const paymentSchema = z.object({
  paid: z.boolean()
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const input = paymentSchema.parse(await readJson(request));
    const current = await prisma.prediction.findUnique({
      where: { id: params.id },
      include: { player: true, game: true }
    });

    if (!current) {
      return fail("Palpite não encontrado.", 404);
    }

    const prediction = await prisma.prediction.update({
      where: { id: params.id },
      data: {
        paidAt: input.paid ? new Date() : null
      },
      include: { player: true, game: true }
    });

    const whatsappResult =
      input.paid && !current.paidAt
        ? await sendPredictionPaidMessage(
            prediction.player,
            prediction.game,
            prediction
          )
        : null;

    return ok({
      prediction,
      whatsappWarning: whatsappResult?.warning ?? null
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao atualizar pagamento.",
      400
    );
  }
}
