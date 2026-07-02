import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  formatBrazilianWhatsapp,
  normalizeWhatsapp
} from "@/lib/phone";
import { hashPlayerPin, isPlayerPinValid, normalizePlayerPin } from "@/lib/player-pin";

export const dynamic = "force-dynamic";

const identifySchema = z.object({
  name: z.string().trim().min(2).optional().or(z.literal("")),
  whatsapp: z.string().trim().min(8),
  pin: z.string().trim().min(4)
});

export async function POST(request: Request) {
  try {
    const input = identifySchema.parse(await readJson(request));
    const whatsapp = normalizeWhatsapp(input.whatsapp);
    const pin = normalizePlayerPin(input.pin);
    const existing = await prisma.player.findUnique({
      where: { whatsapp },
      include: { pool: true }
    });

    if (existing) {
      if (existing.pinHash && !isPlayerPinValid(pin, existing.pinHash)) {
        return fail("Senha de 4 números incorreta para este WhatsApp.", 401);
      }

      const player =
        existing.pinHash === ""
          ? await prisma.player.update({
              where: { id: existing.id },
              data: { pinHash: hashPlayerPin(pin) },
              include: { pool: true }
            })
          : existing;

      return ok({
        player: {
          id: player.id,
          name: player.name,
          whatsapp: player.whatsapp,
          whatsappFormatted: formatBrazilianWhatsapp(player.whatsapp),
          poolId: player.poolId,
          poolName: player.pool?.name ?? null
        },
        created: false
      });
    }

    if (!input.name) {
      return fail(
        "WhatsApp não cadastrado. Informe seu nome para criar o acesso.",
        404,
        { requiresName: true }
      );
    }

    const player = await prisma.player.create({
      data: {
        name: input.name,
        whatsapp,
        pinHash: hashPlayerPin(pin)
      },
      include: { pool: true }
    });

    return ok(
      {
        player: {
          id: player.id,
          name: player.name,
          whatsapp: player.whatsapp,
          whatsappFormatted: formatBrazilianWhatsapp(player.whatsapp),
          poolId: player.poolId,
          poolName: player.pool?.name ?? null
        },
        created: true
      },
      201
    );
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Não foi possível identificar jogador.",
      400
    );
  }
}
