import { fail, ok } from "@/lib/api";
import { getAdminPoolData } from "@/lib/pool-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getAdminPoolData());
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro ao carregar admin.", 500);
  }
}
