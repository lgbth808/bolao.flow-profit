import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import {
  formatBrazilianWhatsapp,
  normalizeWhatsapp
} from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { sendAdminPlayerCreatedMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const playerCreateSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do palpiteiro."),
  whatsapp: z.string().trim().min(8, "Informe o WhatsApp do palpiteiro."),
  poolId: z.string().trim().min(1, "Escolha o bolão do palpiteiro.")
});

export async function POST(request: Request) {
  try {
    const input = playerCreateSchema.parse(await readJson(request));
    const whatsapp = normalizeWhatsapp(input.whatsapp);
    const [pool, existing] = await Promise.all([
      prisma.pool.findUnique({ where: { id: input.poolId } }),
      prisma.player.findUnique({ where: { whatsapp } })
    ]);

    if (!pool) {
      return fail("Bolão não encontrado.", 404);
    }

    if (existing) {
      return fail("Já existe um palpiteiro com este WhatsApp.", 409);
    }

    const player = await prisma.player.create({
      data: {
        name: input.name,
        whatsapp,
        poolId: pool.id,
        pinHash: ""
      },
      include: { pool: true }
    });

    const whatsappResult = await sendAdminPlayerCreatedMessage(player);

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
        whatsappWarning: whatsappResult.warning ?? null
      },
      201
    );
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao cadastrar palpiteiro.",
      400
    );
  }
}
