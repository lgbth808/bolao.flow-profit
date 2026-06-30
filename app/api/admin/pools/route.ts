import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const poolSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do bolão."),
  pixKey: z.string().trim().min(2, "Informe a chave PIX."),
  pixOwner: z.string().trim().min(2, "Informe o titular do PIX.")
});

export async function POST(request: Request) {
  try {
    const input = poolSchema.parse(await readJson(request));
    const pool = await prisma.pool.create({
      data: input
    });

    return ok({ pool }, 201);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro ao cadastrar bolão.", 400);
  }
}
