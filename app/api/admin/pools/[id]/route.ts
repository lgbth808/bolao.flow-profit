import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const poolUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  pixKey: z.string().trim().min(2).optional(),
  pixOwner: z.string().trim().min(2).optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const input = poolUpdateSchema.parse(await readJson(request));
    const pool = await prisma.pool.update({
      where: { id: params.id },
      data: input
    });

    return ok({ pool });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro ao editar bolão.", 400);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.$transaction([
      prisma.game.deleteMany({
        where: { poolId: params.id }
      }),
      prisma.pool.delete({
        where: { id: params.id }
      })
    ]);

    return ok({ deleted: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro ao excluir bolão.", 400);
  }
}
