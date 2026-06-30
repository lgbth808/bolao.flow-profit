import { getPublicPoolData } from "@/lib/pool-data";
import { fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId") ?? undefined;
    const poolId = searchParams.get("poolId") ?? undefined;
    const data = await getPublicPoolData(playerId, { poolId });

    return ok(data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro ao carregar dados.", 500);
  }
}
