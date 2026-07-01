import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import {
  getWhatsappConfig,
  getWhatsappNotificationRules,
  publicWhatsappConfig,
  publicWhatsappNotificationRules,
  saveWhatsappConfig,
  saveWhatsappNotificationRules
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const whatsappConfigSchema = z.object({
  baseUrl: z.string().trim().optional().or(z.literal("")),
  instanceName: z.string().trim().optional().or(z.literal("")),
  apiKey: z.string().trim().optional().or(z.literal("")),
  siteUrl: z.string().trim().optional().or(z.literal("")),
  testNumber: z.string().trim().optional().or(z.literal("")),
  testMessage: z.string().trim().optional().or(z.literal("")),
  rules: z
    .record(
      z.object({
        enabled: z.boolean().optional(),
        template: z.string().trim().optional()
      })
    )
    .optional()
});

export async function GET() {
  try {
    const config = await getWhatsappConfig();
    const rules = await getWhatsappNotificationRules();

    return ok({
      config: publicWhatsappConfig(config),
      rules: publicWhatsappNotificationRules(rules)
    });
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
    const rules = input.rules
      ? await saveWhatsappNotificationRules(input.rules)
      : await getWhatsappNotificationRules();

    return ok({
      saved: true,
      config: publicWhatsappConfig(config),
      rules: publicWhatsappNotificationRules(rules)
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao salvar WhatsApp.",
      400
    );
  }
}
