import { prisma } from "./prisma";
import { getSetting, setSetting } from "./settings";
import { formatBrasiliaDateTime } from "./datetime";
import { normalizeWhatsapp } from "./phone";

export const WHATSAPP_CONFIG_SETTING = "whatsappEvolutionConfig";
export const WHATSAPP_NOTIFICATION_RULES_SETTING = "whatsappNotificationRules";

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

const WHATSAPP_BRAND_HEADER = `👑 bet Barão by d. Rosa

⚽ Trionda • Bolão Copa 2026`;

export type WhatsappNotificationRuleKey =
  | "predictionCreated"
  | "predictionUpdated"
  | "predictionDeleted"
  | "predictionAdminDeleted"
  | "predictionPaid"
  | "newGame"
  | "testMessage"
  | "adminPlayerCreated"
  | "predictionsUnlocked"
  | "resultPublished";

export type WhatsappNotificationRule = {
  enabled: boolean;
  template: string;
};

export type WhatsappNotificationRuleView = WhatsappNotificationRule & {
  key: WhatsappNotificationRuleKey;
  label: string;
  trigger: string;
  implemented: boolean;
  placeholders: string[];
};

type TemplateContext = Partial<
  Record<
    | "playerName"
    | "adminName"
    | "opponent"
    | "opponentFlag"
    | "gameLabel"
    | "kickoffAt"
    | "siteUrl"
    | "instanceName"
    | "brandName"
    | "testMessage",
    string
  >
>;

const TEMPLATE_PLACEHOLDERS = [
  "playerName",
  "adminName",
  "opponent",
  "opponentFlag",
  "gameLabel",
  "kickoffAt",
  "siteUrl",
  "instanceName",
  "brandName",
  "testMessage"
];

const WHATSAPP_RULE_DEFINITIONS: Array<{
  key: WhatsappNotificationRuleKey;
  label: string;
  trigger: string;
  implemented: boolean;
  enabled: boolean;
  template: string;
}> = [
  {
    key: "predictionCreated",
    label: "Palpite cadastrado",
    trigger: "Jogador salva um novo palpite",
    implemented: true,
    enabled: true,
    template: `Olá, {playerName}!

Seu palpite foi registrado com sucesso.

Jogo:
{gameLabel}

Acesse o bolão:
{siteUrl}

Boa sorte!`
  },
  {
    key: "predictionUpdated",
    label: "Palpite atualizado",
    trigger: "Jogador edita um palpite",
    implemented: true,
    enabled: true,
    template: `Olá, {playerName}!

Seu palpite foi atualizado com sucesso.

Jogo:
{gameLabel}

Acesse o bolão:
{siteUrl}

Boa sorte!`
  },
  {
    key: "predictionDeleted",
    label: "Palpite excluído pelo jogador",
    trigger: "Jogador exclui um palpite",
    implemented: true,
    enabled: true,
    template: `Olá, {playerName}!

Seu palpite foi excluído.

Jogo:
{gameLabel}

Você pode fazer um novo palpite até 10 minutos antes do jogo.

Acesse o bolão:
{siteUrl}`
  },
  {
    key: "predictionAdminDeleted",
    label: "Palpite excluído pelo admin",
    trigger: "Admin exclui um palpite",
    implemented: true,
    enabled: true,
    template: `Olá, {playerName}!

Um palpite seu foi excluído pelo admin do bolão.

Jogo:
{gameLabel}

Acesse o bolão:
{siteUrl}`
  },
  {
    key: "predictionPaid",
    label: "Pagamento confirmado",
    trigger: "Admin dá baixa no pagamento",
    implemented: true,
    enabled: true,
    template: `Olá, {playerName}!

Pagamento confirmado pelo admin. Seu palpite está registrado.

Jogo:
{gameLabel}

Acesse o bolão:
{siteUrl}

Boa sorte!`
  },
  {
    key: "newGame",
    label: "Novo jogo cadastrado",
    trigger: "Admin cadastra um jogo no bolão",
    implemented: true,
    enabled: true,
    template: `Olá, {playerName}!

Admin do bolão cadastrou um novo jogo.

Jogo:
{gameLabel}

Data e hora:
{kickoffAt}

Faça seu palpite até 10 minutos antes do início.

Participe do bolão:
{siteUrl}

Boa sorte!`
  },
  {
    key: "testMessage",
    label: "Mensagem de teste",
    trigger: "Admin clica em Testar envio",
    implemented: true,
    enabled: true,
    template: `Teste do WhatsApp: {testMessage}

Acesse o bolão:
{siteUrl}`
  },
  {
    key: "adminPlayerCreated",
    label: "Apresentação do WhatsApp oficial",
    trigger: "Admin cadastra um palpiteiro",
    implemented: true,
    enabled: true,
    template: `Olá, {playerName}!

Seu acesso foi cadastrado pelo admin do bolão.

Entre com este WhatsApp e crie sua senha de 4 números no primeiro acesso.

Acessar o bolão:
{siteUrl}`
  },
  {
    key: "predictionsUnlocked",
    label: "Palpites liberados 10 minutos antes",
    trigger: "Planejado: apostas fecham e palpites ficam visíveis",
    implemented: false,
    enabled: false,
    template: `Planejado: avisar quando os palpites forem liberados para {gameLabel}.`
  },
  {
    key: "resultPublished",
    label: "Resultado publicado",
    trigger: "Planejado: placar final e rateio publicados",
    implemented: false,
    enabled: false,
    template: `Planejado: avisar quando o resultado de {gameLabel} for publicado.`
  }
];

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

function defaultWhatsappRules() {
  return Object.fromEntries(
    WHATSAPP_RULE_DEFINITIONS.map((definition) => [
      definition.key,
      {
        enabled: definition.enabled,
        template: definition.template
      }
    ])
  ) as Record<WhatsappNotificationRuleKey, WhatsappNotificationRule>;
}

function mergeWhatsappRules(
  input: Partial<Record<WhatsappNotificationRuleKey, Partial<WhatsappNotificationRule>>>
) {
  const defaults = defaultWhatsappRules();

  return Object.fromEntries(
    WHATSAPP_RULE_DEFINITIONS.map((definition) => {
      const current = input[definition.key];
      const enabled =
        typeof current?.enabled === "boolean"
          ? current.enabled
          : defaults[definition.key].enabled;
      const template =
        typeof current?.template === "string" && current.template.trim()
          ? current.template.trim()
          : defaults[definition.key].template;

      return [
        definition.key,
        {
          enabled: definition.implemented ? enabled : false,
          template
        }
      ];
    })
  ) as Record<WhatsappNotificationRuleKey, WhatsappNotificationRule>;
}

export async function getWhatsappNotificationRules() {
  const raw = await getSetting(WHATSAPP_NOTIFICATION_RULES_SETTING);

  if (!raw) {
    return defaultWhatsappRules();
  }

  try {
    return mergeWhatsappRules(
      JSON.parse(raw) as Partial<
        Record<WhatsappNotificationRuleKey, Partial<WhatsappNotificationRule>>
      >
    );
  } catch {
    return defaultWhatsappRules();
  }
}

export async function saveWhatsappNotificationRules(
  input: Partial<Record<WhatsappNotificationRuleKey, Partial<WhatsappNotificationRule>>>
) {
  const current = await getWhatsappNotificationRules();
  const merged = mergeWhatsappRules({
    ...current,
    ...input
  });

  await setSetting(WHATSAPP_NOTIFICATION_RULES_SETTING, JSON.stringify(merged));

  return merged;
}

export function publicWhatsappNotificationRules(
  rules: Record<WhatsappNotificationRuleKey, WhatsappNotificationRule>
): WhatsappNotificationRuleView[] {
  return WHATSAPP_RULE_DEFINITIONS.map((definition) => ({
    key: definition.key,
    label: definition.label,
    trigger: definition.trigger,
    implemented: definition.implemented,
    placeholders: TEMPLATE_PLACEHOLDERS,
    enabled: rules[definition.key]?.enabled ?? definition.enabled,
    template: rules[definition.key]?.template ?? definition.template
  }));
}

export function formatWhatsappNumber(phone: string) {
  try {
    return normalizeWhatsapp(phone);
  } catch {
    return null;
  }
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

function templateContext(
  config: WhatsappConfig,
  player?: WhatsappPlayer,
  game?: WhatsappGame,
  extra?: TemplateContext
): TemplateContext {
  return {
    brandName: "bet Barão by d. Rosa",
    adminName: "Admin do bolão",
    instanceName: config.instanceName,
    siteUrl: config.siteUrl,
    playerName: player?.name ?? "",
    opponent: game?.opponent ?? "",
    opponentFlag: game?.opponentFlag ?? "",
    gameLabel: game ? gameLabel(game) : "",
    kickoffAt: game ? formatKickoff(game.kickoffAt) : "",
    ...extra
  };
}

function renderTemplate(template: string, context: TemplateContext) {
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, key) => {
    if (!TEMPLATE_PLACEHOLDERS.includes(key)) {
      return match;
    }

    return context[key as keyof TemplateContext] ?? "";
  });
}

async function sendWhatsappRuleMessage(
  ruleKey: WhatsappNotificationRuleKey,
  phone: string,
  context: TemplateContext
) {
  const rules = await getWhatsappNotificationRules();
  const definition = WHATSAPP_RULE_DEFINITIONS.find(
    (item) => item.key === ruleKey
  );
  const rule = rules[ruleKey];

  if (!definition?.implemented || !rule?.enabled) {
    return { sent: false, skipped: true } as WhatsappSendResult;
  }

  const body = renderTemplate(rule.template, context).trim();

  return sendWhatsappMessage(phone, `${WHATSAPP_BRAND_HEADER}\n\n${body}`);
}

export async function sendPredictionCreatedMessage(
  player: WhatsappPlayer,
  game: WhatsappGame,
  prediction: WhatsappPrediction
) {
  void prediction;
  const config = await getWhatsappConfig();

  return sendWhatsappRuleMessage(
    "predictionCreated",
    player.whatsapp,
    templateContext(config, player, game)
  );
}

export async function sendPredictionUpdatedMessage(
  player: WhatsappPlayer,
  game: WhatsappGame,
  prediction: WhatsappPrediction
) {
  void prediction;
  const config = await getWhatsappConfig();

  return sendWhatsappRuleMessage(
    "predictionUpdated",
    player.whatsapp,
    templateContext(config, player, game)
  );
}

export async function sendPredictionDeletedMessage(
  player: WhatsappPlayer,
  game: WhatsappGame
) {
  const config = await getWhatsappConfig();

  return sendWhatsappRuleMessage(
    "predictionDeleted",
    player.whatsapp,
    templateContext(config, player, game)
  );
}

export async function sendPredictionAdminDeletedMessage(
  player: WhatsappPlayer,
  game: WhatsappGame
) {
  const config = await getWhatsappConfig();

  return sendWhatsappRuleMessage(
    "predictionAdminDeleted",
    player.whatsapp,
    templateContext(config, player, game)
  );
}

export async function sendPredictionPaidMessage(
  player: WhatsappPlayer,
  game: WhatsappGame,
  prediction: WhatsappPrediction
) {
  void prediction;
  const config = await getWhatsappConfig();

  return sendWhatsappRuleMessage(
    "predictionPaid",
    player.whatsapp,
    templateContext(config, player, game)
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
      sendWhatsappRuleMessage(
        "newGame",
        player.whatsapp,
        templateContext(config, player, game)
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

  return sendWhatsappRuleMessage(
    "testMessage",
    config.testNumber,
    templateContext(config, undefined, undefined, {
      testMessage:
        config.testMessage ||
        "se você recebeu esta mensagem, a Evolution API está conectada corretamente."
    })
  );
}

export async function sendAdminPlayerCreatedMessage(player: WhatsappPlayer) {
  const config = await getWhatsappConfig();

  return sendWhatsappRuleMessage(
    "adminPlayerCreated",
    player.whatsapp,
    templateContext(config, player)
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
