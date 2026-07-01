import { prisma } from "./prisma";
import { getSetting, setSetting } from "./settings";
import { formatBrasiliaDateTime } from "./datetime";

export const WHATSAPP_CONFIG_SETTING = "whatsappEvolutionConfig";

export type WhatsappConfig = {
  baseUrl: string;
  instanceName: string;
  apiKey: string;
  siteUrl: string;
  testNumber: string;
  testMessage: string;
};

type WhatsappSendResult = {
  sent: boolean;
  skipped: boolean;
  warning?: string;
};

type WhatsappPlayer = {
  id: string;
  name: string;
  whatsapp: string;
};

type WhatsappGame = {
  id: string;
  opponent: string;
  opponentFlag?: string | null;
  kickoffAt?: Date | string;
  poolId?: string | null;
  newGameWhatsappSentAt?: Date | string | null;
};

type WhatsappPrediction = {
  brazilGoals: number;
  opponentGoals: number;
};

function emptyWhatsappConfig(): WhatsappConfig {
  return {
    baseUrl: "",
    instanceName: "",
    apiKey: "",
    siteUrl: "",
    testNumber: "",
    testMessage: ""
  };
}

function mergeConfig(input: Partial<WhatsappConfig>): WhatsappConfig {
  return {
    ...emptyWhatsappConfig(),
    ...input,
    baseUrl: input.baseUrl?.trim().replace(/\/+$/, "") ?? "",
    instanceName: input.instanceName?.trim() ?? "",
    apiKey: input.apiKey?.trim() ?? "",
    siteUrl: input.siteUrl?.trim() ?? "",
    testNumber: input.testNumber?.trim() ?? "",
    testMessage: input.testMessage?.trim() ?? ""
  };
}

export async function saveWhatsappConfig(config: Partial<WhatsappConfig>) {
  const normalized = mergeConfig(config);

  await setSetting(WHATSAPP_CONFIG_SETTING, JSON.stringify(normalized));

  return normalized;
}

export async function getWhatsappConfig(): Promise<WhatsappConfig> {
  const raw = await getSetting(WHATSAPP_CONFIG_SETTING);

  if (!raw) {
    return emptyWhatsappConfig();
  }

  try {
    return mergeConfig(JSON.parse(raw) as Partial<WhatsappConfig>);
  } catch {
    return emptyWhatsappConfig();
  }
}

export function formatWhatsappNumber(phone: string) {
  const explicitCountryCode = phone.trim().startsWith("+");
  const digits = phone.replace(/\D/g, "");

  if (explicitCountryCode && /^[1-9]\d{7,14}$/.test(digits)) {
    return digits;
  }

  const withCountryCode =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
      ? digits
      : digits.length === 10 || digits.length === 11
        ? `55${digits}`
        : digits;

  return /^[1-9]\d{7,14}$/.test(withCountryCode) ? withCountryCode : null;
}

function hasSendConfig(config: WhatsappConfig) {
  return Boolean(
    config.baseUrl && config.instanceName && config.apiKey && config.siteUrl
  );
}

function messageUrl(config: WhatsappConfig) {
  return `${config.baseUrl}/message/sendText/${config.instanceName}`;
}

export async function sendWhatsappMessage(
  phone: string,
  message: string
): Promise<WhatsappSendResult> {
  const config = await getWhatsappConfig();

  if (!hasSendConfig(config)) {
    return { sent: false, skipped: true };
  }

  const number = formatWhatsappNumber(phone);

  if (!number) {
    return { sent: false, skipped: true };
  }

  try {
    // Em produção, o envio de WhatsApp deve passar por backend ou serverless
    // function para proteger a API Key.
    const response = await fetch(messageUrl(config), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey
      },
      body: JSON.stringify({
        number,
        text: message
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        sent: false,
        skipped: false,
        warning: `Ação salva, mas não foi possível enviar WhatsApp. HTTP ${response.status}.`
      };
    }

    return { sent: true, skipped: false };
  } catch (error) {
    return {
      sent: false,
      skipped: false,
      warning:
        error instanceof Error
          ? `Ação salva, mas não foi possível enviar WhatsApp. ${error.message}`
          : "Ação salva, mas não foi possível enviar WhatsApp."
    };
  }
}

function siteUrlText() {
  return getWhatsappConfig().then((config) => config.siteUrl);
}

function formatKickoff(value: Date | string | undefined) {
  if (!value) {
    return "Data a confirmar";
  }

  return formatBrasiliaDateTime(value);
}

function gameLabel(game: WhatsappGame) {
  const opponent = [game.opponentFlag, game.opponent]
    .filter(Boolean)
    .join(" ")
    .trim();

  return `🇧🇷 Brasil x ${opponent}`;
}

function firstWarning(results: WhatsappSendResult[]) {
  return results.find((result) => result.warning)?.warning;
}

export async function sendPredictionCreatedMessage(
  player: WhatsappPlayer,
  game: WhatsappGame,
  prediction: WhatsappPrediction
) {
  void prediction;
  const siteUrl = await siteUrlText();

  return sendWhatsappMessage(
    player.whatsapp,
    `⚽ Bolão Copa 2026

Olá, ${player.name}!

Seu palpite foi registrado com sucesso.

Jogo:
${gameLabel(game)}

Acesse o bolão:
${siteUrl}

Boa sorte!`
  );
}

export async function sendPredictionUpdatedMessage(
  player: WhatsappPlayer,
  game: WhatsappGame,
  prediction: WhatsappPrediction
) {
  void prediction;
  const siteUrl = await siteUrlText();

  return sendWhatsappMessage(
    player.whatsapp,
    `⚽ Bolão Copa 2026

Olá, ${player.name}!

Seu palpite foi atualizado com sucesso.

Jogo:
${gameLabel(game)}

Acesse o bolão:
${siteUrl}

Boa sorte!`
  );
}

export async function sendPredictionDeletedMessage(
  player: WhatsappPlayer,
  game: WhatsappGame
) {
  const siteUrl = await siteUrlText();

  return sendWhatsappMessage(
    player.whatsapp,
    `⚽ Bolão Copa 2026

Olá, ${player.name}!

Seu palpite foi excluído.

Jogo:
${gameLabel(game)}

Você pode fazer um novo palpite até 10 minutos antes do jogo.

Acesse o bolão:
${siteUrl}`
  );
}

export async function sendPredictionAdminDeletedMessage(
  player: WhatsappPlayer,
  game: WhatsappGame
) {
  const siteUrl = await siteUrlText();

  return sendWhatsappMessage(
    player.whatsapp,
    `⚽ Bolão Copa 2026

Olá, ${player.name}!

Um palpite seu foi excluído pelo admin do bolão.

Jogo:
${gameLabel(game)}

Acesse o bolão:
${siteUrl}`
  );
}

export async function sendPredictionPaidMessage(
  player: WhatsappPlayer,
  game: WhatsappGame,
  prediction: WhatsappPrediction
) {
  void prediction;
  const siteUrl = await siteUrlText();

  return sendWhatsappMessage(
    player.whatsapp,
    `⚽ Bolão Copa 2026

Olá, ${player.name}!

Pagamento confirmado pelo admin. Seu palpite está registrado.

Jogo:
${gameLabel(game)}

Acesse o bolão:
${siteUrl}

Boa sorte!`
  );
}

export async function sendNewGameMessageToPlayers(game: WhatsappGame) {
  if (!game.poolId || game.newGameWhatsappSentAt) {
    return { sent: false, skipped: true } as WhatsappSendResult;
  }

  const config = await getWhatsappConfig();

  if (!hasSendConfig(config)) {
    return { sent: false, skipped: true } as WhatsappSendResult;
  }

  const players = await prisma.player.findMany({
    where: { poolId: game.poolId },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }]
  });

  const results = await Promise.all(
    players.map((player) =>
      sendWhatsappMessage(
        player.whatsapp,
        `⚽ Novo jogo no Bolão Copa 2026!

Olá, ${player.name}!

Admin do bolão cadastrou um novo jogo.

Jogo:
${gameLabel(game)}

Data e hora:
${formatKickoff(game.kickoffAt)}

Faça seu palpite até 10 minutos antes do início.

Participe do bolão:
${config.siteUrl}

Boa sorte!`
      )
    )
  );

  if (results.some((result) => result.sent)) {
    await prisma.game.update({
      where: { id: game.id },
      data: { newGameWhatsappSentAt: new Date() }
    });
  }

  return {
    sent: results.some((result) => result.sent),
    skipped: results.every((result) => result.skipped),
    warning: firstWarning(results)
  } as WhatsappSendResult;
}

export async function testWhatsappMessage() {
  const config = await getWhatsappConfig();
  const text = `✅ Teste do WhatsApp do Bet Barão

Se você recebeu esta mensagem, a Evolution API está conectada corretamente.

Acesse o bolão:
${config.siteUrl}`;

  return sendWhatsappMessage(config.testNumber, text);
}

export async function sendAdminPlayerCreatedMessage(player: WhatsappPlayer) {
  const siteUrl = await siteUrlText();

  return sendWhatsappMessage(
    player.whatsapp,
    `⚽ Bet Barão by d. Rosa

Olá, ${player.name}!

Seu acesso foi cadastrado pelo admin do bolão.

Entre com este WhatsApp e crie sua senha de 4 números no primeiro acesso.

Acessar o bolão:
${siteUrl}`
  );
}

export function publicWhatsappConfig(config: WhatsappConfig) {
  return {
    baseUrl: config.baseUrl,
    instanceName: config.instanceName,
    apiKey: "",
    apiKeyConfigured: Boolean(config.apiKey),
    siteUrl: config.siteUrl,
    testNumber: config.testNumber,
    testMessage: config.testMessage
  };
}
