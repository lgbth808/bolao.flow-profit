import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import {
  getWhatsappConfig,
  publicWhatsappConfig,
  saveWhatsappConfig
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const whatsappConfigSchema = z.object({
  baseUrl: z.string().trim().optional().or(z.literal("")),
  instanceName: z.string().trim().optional().or(z.literal("")),
  apiKey: z.string().trim().optional().or(z.literal("")),
  siteUrl: z.string().trim().optional().or(z.literal("")),
  testNumber: z.string().trim().optional().or(z.literal("")),
  testMessage: z.string().trim().optional().or(z.literal(""))
});

export async function GET() {
  try {
    const config = await getWhatsappConfig();

    return ok({ config: publicWhatsappConfig(config) });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao carregar WhatsApp.",
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = whatsappConfigSchema.parse(await readJson(request));
    const current = await getWhatsappConfig();
    const config = await saveWhatsappConfig({
      ...current,
      ...input,
      apiKey: input.apiKey || current.apiKey
    });

    return ok({ saved: true, config: publicWhatsappConfig(config) });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao salvar WhatsApp.",
      400
    );
  }
}
