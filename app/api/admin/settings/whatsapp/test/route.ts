import { fail, ok } from "@/lib/api";
import { testWhatsappMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await testWhatsappMessage();

    if (result.warning) {
      return ok({ sent: false, warning: result.warning });
    }

    return ok({ sent: result.sent, skipped: result.skipped });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Erro ao testar WhatsApp.",
      400
    );
  }
}
