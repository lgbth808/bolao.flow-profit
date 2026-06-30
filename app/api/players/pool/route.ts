import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { isPlayerPinValid } from "@/lib/player-pin";
import { formatBrazilianWhatsapp } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const choosePoolSchema = z.object({
  playerId: z.string().min(1),
  poolId: z.string().min(1),
  pin: z.string().trim().min(4)
});

export async function POST(request: Request) {
  try {
    const input = choosePoolSchema.parse(await readJson(request));
    const [player, pool] = await Promise.all([
      prisma.player.findUnique({
        where: { id: input.playerId },
        include: { pool: true }
      }),
      prisma.pool.findUnique({
        where: { id: input.poolId }
      })
    ]);

    if (!player) {
      return fail("Jogador não encontrado.", 404);
    }

    if (!pool) {
      return fail("Bolão não encontrado.", 404);
    }

    if (!isPlayerPinValid(input.pin, player.pinHash)) {
      return fail("Senha de 4 números incorreta para este WhatsApp.", 401);
    }

    if (player.poolId && player.poolId !== pool.id) {
      return fail(
        `Este WhatsApp já participa do bolão "${player.pool?.name ?? "selecionado"}". Cada WhatsApp pode participar de apenas 1 bolão.`,
        409
      );
    }

    const updated = player.poolId
      ? player
      : await prisma.player.update({
          where: { id: player.id },
          data: { poolId: pool.id },
          include: { pool: true }
        });

    return ok({
      player: {
        id: updated.id,
        name: updated.name,
        whatsapp: updated.whatsapp,
        whatsappFormatted: formatBrazilianWhatsapp(updated.whatsapp),
        poolId: updated.poolId,
        poolName: updated.pool?.name ?? null
      }
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao escolher bolão.",
      400
    );
  }
}
