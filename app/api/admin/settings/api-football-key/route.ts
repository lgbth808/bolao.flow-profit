import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { API_FOOTBALL_KEY_SETTING, setSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

const apiKeySchema = z.object({
  apiKey: z.string().trim().min(1, "Informe a API Key API-Football.")
});

export async function POST(request: Request) {
  try {
    const input = apiKeySchema.parse(await readJson(request));

    await setSetting(API_FOOTBALL_KEY_SETTING, input.apiKey);

    return ok({ saved: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Erro ao salvar API Key.", 400);
  }
}
