import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { normalizeCurrencyInput } from "@/lib/money";
import {
  formatBrazilianWhatsapp,
  normalizeBrazilianWhatsapp
} from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const playerUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  whatsapp: z.string().trim().min(8).optional(),
  valorPago: z.union([z.string(), z.number()]).optional(),
  resetPin: z.boolean().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const input = playerUpdateSchema.parse(await readJson(request));
    const whatsapp =
      input.whatsapp === undefined
        ? undefined
        : normalizeBrazilianWhatsapp(input.whatsapp);

    if (whatsapp) {
      const current = await prisma.player.findUnique({
        where: { id: params.id }
      });

      if (!current) {
        return fail("Palpiteiro não encontrado.", 404);
      }

      const existing = await prisma.player.findUnique({
        where: { whatsapp }
      });

      if (existing && existing.id !== current.id) {
        const merged = await prisma.$transaction(async (tx) => {
          const sourcePredictionCount = await tx.prediction.count({
            where: { playerId: current.id }
          });
          const targetPredictionCount = await tx.prediction.count({
            where: { playerId: existing.id }
          });
          const legacyValorPago =
            Number(current.valorPago) + Number(existing.valorPago);
          const target = await tx.player.update({
            where: { id: existing.id },
            data: {
              name: input.name ?? existing.name,
              poolId: existing.poolId ?? current.poolId,
              pinHash: input.resetPin ? "" : existing.pinHash,
              valorPago:
                input.valorPago === undefined
                  ? legacyValorPago
                  : normalizeCurrencyInput(input.valorPago)
            }
          });

          await tx.prediction.updateMany({
            where: { playerId: current.id },
            data: { playerId: target.id }
          });
          await tx.predictionAudit.updateMany({
            where: { playerId: current.id },
            data: {
              playerId: target.id,
              playerName: target.name,
              playerWhatsapp: target.whatsapp
            }
          });
          await tx.player.delete({
            where: { id: current.id }
          });

          return {
            ...target,
            mergedPredictionCount: sourcePredictionCount + targetPredictionCount
          };
        });

        return ok({
          player: {
            ...merged,
            whatsappFormatted: formatBrazilianWhatsapp(merged.whatsapp)
          },
          merged: true
        });
      }
    }

    const data = {
      name: input.name,
      whatsapp,
      pinHash: input.resetPin ? "" : undefined,
      valorPago:
        input.valorPago === undefined
          ? undefined
          : normalizeCurrencyInput(input.valorPago)
    };

    const player = await prisma.player.update({
      where: { id: params.id },
      data
    });

    return ok({ player });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro ao editar jogador.", 400);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.player.delete({
      where: { id: params.id }
    });

    return ok({ deleted: true });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao excluir palpiteiro.",
      400
    );
  }
}
