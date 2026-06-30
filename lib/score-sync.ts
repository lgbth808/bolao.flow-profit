import type { Prisma } from "@prisma/client";
import { getApiFootballKey } from "./settings";
import { prisma } from "./prisma";
import { finalizeGamePrizeSnapshot } from "./prize";
import type { GameStatusValue } from "./pool-rules";

export const SCORE_SYNC_INTERVAL_MS = 5 * 60_000;
export const SCORE_SYNC_WINDOW_MS = 2 * 60 * 60 * 1000;

const API_FOOTBALL_ENDPOINT = "https://v3.football.api-sports.io/fixtures";
const API_FOOTBALL_TEAMS_ENDPOINT = "https://v3.football.api-sports.io/teams";
const API_FOOTBALL_LEAGUES_ENDPOINT = "https://v3.football.api-sports.io/leagues";
const FINAL_STATUS_SHORTS = new Set(["FT", "AET", "PEN"]);

type ScoreSyncGame = {
  id: string;
  opponent: string;
  kickoffAt: Date;
  status: string;
  apiFootballFixtureId: string | null;
  scoreLastSyncedAt: Date | null;
  finishedAt: Date | null;
};

type ApiFootballFixture = {
  fixture?: {
    date?: string;
    status?: {
      short?: string | null;
      long?: string | null;
      elapsed?: number | null;
    };
  };
  teams?: {
    home?: { name?: string | null };
    away?: { name?: string | null };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
  score?: {
    fulltime?: {
      home?: number | null;
      away?: number | null;
    };
  };
};

type ParsedFootballScore = {
  brazilScore: number;
  opponentScore: number;
  statusShort: string | null;
  statusLong: string | null;
  elapsed: number | null;
  nextStatus: GameStatusValue;
  isFinal: boolean;
};

export type ApiFootballFixtureCandidate = {
  fixtureId: number;
  kickoffAt: string;
  homeName: string;
  awayName: string;
  opponent: string;
  round: string;
  statusShort: string | null;
  statusLong: string | null;
  elapsed: number | null;
  brazilScore: number;
  opponentScore: number;
  suggestedStatus: GameStatusValue;
};

export type ApiFootballTeamCandidate = {
  id: number;
  name: string;
  code: string | null;
  country: string | null;
  national: boolean | null;
  logo: string | null;
};

export type ApiFootballLeagueCandidate = {
  id: number;
  name: string;
  type: string | null;
  country: string | null;
  logo: string | null;
  season: number | null;
};

type SyncResult = {
  gameId: string;
  opponent: string;
  updated: boolean;
  skipped: boolean;
  reason?: string;
  scoreLabel?: string;
  status?: GameStatusValue;
  error?: string;
};

const scoreSyncGameSelect = {
  id: true,
  opponent: true,
  kickoffAt: true,
  status: true,
  apiFootballFixtureId: true,
  scoreLastSyncedAt: true,
  finishedAt: true
} satisfies Prisma.GameSelect;

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isBrazilTeamName(value: unknown) {
  const normalized = normalizeText(value);

  return normalized.includes("brasil") || normalized.includes("brazil");
}

function gameStatusFromApiStatus(statusShort: string | null): GameStatusValue {
  if (statusShort && FINAL_STATUS_SHORTS.has(statusShort)) {
    return "ENCERRADO";
  }

  return "ABERTO";
}

function isOpponentName(value: unknown, opponent: string) {
  const normalized = normalizeText(value);
  const opponentNormalized = normalizeText(opponent);

  return Boolean(opponentNormalized) && normalized.includes(opponentNormalized);
}

function isInsideSyncWindow(kickoffAt: Date, now = new Date()) {
  const start = kickoffAt.getTime();
  const end = start + SCORE_SYNC_WINDOW_MS;
  const current = now.getTime();

  return current >= start && current <= end;
}

function isDueForSync(game: ScoreSyncGame, now = new Date()) {
  if (!game.scoreLastSyncedAt) {
    return true;
  }

  return now.getTime() - game.scoreLastSyncedAt.getTime() >= SCORE_SYNC_INTERVAL_MS;
}

function asScore(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  return 0;
}

function getFixtureFromPayload(payload: unknown): ApiFootballFixture {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("response" in payload) ||
    !Array.isArray(payload.response) ||
    payload.response.length === 0
  ) {
    throw new Error("API-Football não retornou dados para este Fixture ID.");
  }

  return payload.response[0] as ApiFootballFixture;
}

function parseApiFootballFixture(
  fixture: ApiFootballFixture,
  opponent: string
): ParsedFootballScore {
  const homeName = fixture.teams?.home?.name ?? "";
  const awayName = fixture.teams?.away?.name ?? "";
  const statusShort = fixture.fixture?.status?.short ?? null;
  const statusLong = fixture.fixture?.status?.long ?? null;
  const elapsed = fixture.fixture?.status?.elapsed ?? null;
  const isFinal = statusShort ? FINAL_STATUS_SHORTS.has(statusShort) : false;
  const homeScore = isFinal
    ? asScore(fixture.score?.fulltime?.home ?? fixture.goals?.home)
    : asScore(fixture.goals?.home);
  const awayScore = isFinal
    ? asScore(fixture.score?.fulltime?.away ?? fixture.goals?.away)
    : asScore(fixture.goals?.away);
  const brazilIsHome = isBrazilTeamName(homeName) || isOpponentName(awayName, opponent);
  const brazilIsAway = isBrazilTeamName(awayName) || isOpponentName(homeName, opponent);

  if (!brazilIsHome && !brazilIsAway) {
    throw new Error(
      "Não consegui identificar Brasil/Brazil como mandante ou visitante no fixture."
    );
  }

  const nextStatus: GameStatusValue = gameStatusFromApiStatus(statusShort);

  return {
    brazilScore: brazilIsHome ? homeScore : awayScore,
    opponentScore: brazilIsHome ? awayScore : homeScore,
    statusShort,
    statusLong,
    elapsed,
    nextStatus,
    isFinal
  };
}

function parseApiFootballFixtureCandidate(
  fixture: ApiFootballFixture & {
    fixture?: ApiFootballFixture["fixture"] & { id?: number };
    league?: { round?: string | null };
  }
): ApiFootballFixtureCandidate | null {
  const fixtureId = fixture.fixture?.id;
  const kickoffAt = fixture.fixture?.date;
  const homeName = fixture.teams?.home?.name ?? "";
  const awayName = fixture.teams?.away?.name ?? "";

  if (!fixtureId || !kickoffAt) {
    return null;
  }

  const statusShort = fixture.fixture?.status?.short ?? null;
  const statusLong = fixture.fixture?.status?.long ?? null;
  const elapsed = fixture.fixture?.status?.elapsed ?? null;
  const isFinal = statusShort ? FINAL_STATUS_SHORTS.has(statusShort) : false;
  const homeScore = isFinal
    ? asScore(fixture.score?.fulltime?.home ?? fixture.goals?.home)
    : asScore(fixture.goals?.home);
  const awayScore = isFinal
    ? asScore(fixture.score?.fulltime?.away ?? fixture.goals?.away)
    : asScore(fixture.goals?.away);
  const brazilIsHome = isBrazilTeamName(homeName);
  const brazilIsAway = isBrazilTeamName(awayName);

  if (!brazilIsHome && !brazilIsAway) {
    return null;
  }

  return {
    fixtureId,
    kickoffAt,
    homeName,
    awayName,
    opponent: brazilIsHome ? awayName : homeName,
    round: fixture.league?.round ?? "Jogo do Brasil",
    statusShort,
    statusLong,
    elapsed,
    brazilScore: brazilIsHome ? homeScore : awayScore,
    opponentScore: brazilIsHome ? awayScore : homeScore,
    suggestedStatus: gameStatusFromApiStatus(statusShort)
  };
}

async function fetchApiFootballScore(game: ScoreSyncGame, apiKey: string) {
  if (!game.apiFootballFixtureId) {
    throw new Error("Jogo sem Fixture ID API-Football.");
  }

  // MVP/local: a chave e salva pelo admin no banco local. Em producao,
  // mantenha a chamada em backend/serverless para não expor a chave no browser.
  const url = new URL(API_FOOTBALL_ENDPOINT);
  url.searchParams.set("id", game.apiFootballFixtureId);

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API-Football retornou HTTP ${response.status}.`);
  }

  return parseApiFootballFixture(getFixtureFromPayload(await response.json()), game.opponent);
}

export async function searchApiFootballFixtures(input: {
  leagueId: string;
  season: string;
  teamId: string;
  date?: string;
}) {
  const apiKey = await getApiFootballKey();

  if (!apiKey) {
    throw new Error("API Key API-Football não configurada.");
  }

  if (!/^\d+$/.test(input.leagueId) || !/^\d+$/.test(input.teamId)) {
    throw new Error(
      "Na API-Football, league e team precisam ser IDs numéricos. Ex.: league=1, team=6."
    );
  }

  if (!/^\d{4}$/.test(input.season)) {
    throw new Error("Informe a temporada com 4 dígitos. Ex.: 2026.");
  }

  const url = new URL(API_FOOTBALL_ENDPOINT);
  url.searchParams.set("league", input.leagueId);
  url.searchParams.set("season", input.season);
  url.searchParams.set("team", input.teamId);

  if (input.date) {
    url.searchParams.set("date", input.date);
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API-Football retornou HTTP ${response.status}.`);
  }

  const payload = await response.json();

  if (
    !payload ||
    typeof payload !== "object" ||
    !("response" in payload) ||
    !Array.isArray(payload.response)
  ) {
    throw new Error("API-Football retornou uma resposta inesperada.");
  }

  if (
    "errors" in payload &&
    payload.errors &&
    typeof payload.errors === "object" &&
    Object.keys(payload.errors).length > 0
  ) {
    throw new Error(
      `API-Football recusou a consulta: ${JSON.stringify(payload.errors)}`
    );
  }

  return payload.response
    .map((fixture: ApiFootballFixture) =>
      parseApiFootballFixtureCandidate(fixture)
    )
    .filter(Boolean)
    .slice(0, 20) as ApiFootballFixtureCandidate[];
}

export async function searchApiFootballTeams(input: {
  search?: string;
  country?: string;
  code?: string;
}) {
  const apiKey = await getApiFootballKey();

  if (!apiKey) {
    throw new Error("API Key API-Football não configurada.");
  }

  const url = new URL(API_FOOTBALL_TEAMS_ENDPOINT);
  const search = input.search?.trim();
  const country = input.country?.trim();
  const code = input.code?.trim();

  if (search) {
    url.searchParams.set("search", search);
  }

  if (country) {
    url.searchParams.set("country", country);
  }

  if (code) {
    url.searchParams.set("code", code);
  }

  if (!search && !country && !code) {
    throw new Error("Informe nome, país ou código para buscar o time.");
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API-Football retornou HTTP ${response.status}.`);
  }

  const payload = await response.json();

  if (
    !payload ||
    typeof payload !== "object" ||
    !("response" in payload) ||
    !Array.isArray(payload.response)
  ) {
    throw new Error("API-Football retornou uma resposta inesperada.");
  }

  if (
    "errors" in payload &&
    payload.errors &&
    typeof payload.errors === "object" &&
    Object.keys(payload.errors).length > 0
  ) {
    throw new Error(
      `API-Football recusou a consulta: ${JSON.stringify(payload.errors)}`
    );
  }

  return payload.response
    .map((item: unknown) => {
      const team = (item as { team?: Partial<ApiFootballTeamCandidate> }).team;

      if (!team?.id || !team.name) {
        return null;
      }

      return {
        id: team.id,
        name: team.name,
        code: team.code ?? null,
        country: team.country ?? null,
        national: team.national ?? null,
        logo: team.logo ?? null
      };
    })
    .filter(Boolean)
    .slice(0, 20) as ApiFootballTeamCandidate[];
}

export async function searchApiFootballLeagues(input: {
  search?: string;
  country?: string;
  season?: string;
  current?: boolean;
}) {
  const apiKey = await getApiFootballKey();

  if (!apiKey) {
    throw new Error("API Key API-Football não configurada.");
  }

  const url = new URL(API_FOOTBALL_LEAGUES_ENDPOINT);
  const search = input.search?.trim();
  const country = input.country?.trim();
  const season = input.season?.trim();

  if (search) {
    url.searchParams.set("search", search);
  }

  if (country) {
    url.searchParams.set("country", country);
  }

  if (season) {
    if (!/^\d{4}$/.test(season)) {
      throw new Error("Season precisa ter 4 dígitos. Ex.: 2026.");
    }

    url.searchParams.set("season", season);
  }

  if (input.current) {
    url.searchParams.set("current", "true");
  }

  if (!search && !country && !season && !input.current) {
    throw new Error("Informe nome, país, temporada ou atual para buscar ligas.");
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API-Football retornou HTTP ${response.status}.`);
  }

  const payload = await response.json();

  if (
    !payload ||
    typeof payload !== "object" ||
    !("response" in payload) ||
    !Array.isArray(payload.response)
  ) {
    throw new Error("API-Football retornou uma resposta inesperada.");
  }

  if (
    "errors" in payload &&
    payload.errors &&
    typeof payload.errors === "object" &&
    Object.keys(payload.errors).length > 0
  ) {
    throw new Error(
      `API-Football recusou a consulta: ${JSON.stringify(payload.errors)}`
    );
  }

  return payload.response
    .map((item: unknown) => {
      const record = item as {
        league?: {
          id?: number;
          name?: string;
          type?: string | null;
          logo?: string | null;
        };
        country?: { name?: string | null };
        seasons?: Array<{ year?: number | null }>;
      };

      if (!record.league?.id || !record.league.name) {
        return null;
      }

      return {
        id: record.league.id,
        name: record.league.name,
        type: record.league.type ?? null,
        country: record.country?.name ?? null,
        logo: record.league.logo ?? null,
        season: record.seasons?.[0]?.year ?? null
      };
    })
    .filter(Boolean)
    .slice(0, 20) as ApiFootballLeagueCandidate[];
}

export function shouldRevealPublicScore(kickoffAt: Date | string, now = new Date()) {
  const kickoff = new Date(kickoffAt);
  const revealAt = kickoff.getTime() - 10 * 60_000;

  return now.getTime() >= revealAt;
}

export async function syncGameScoreById(
  gameId: string,
  options: { ignoreInterval?: boolean; allowFinalized?: boolean } = {}
): Promise<SyncResult> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: scoreSyncGameSelect
  });

  if (!game) {
    return {
      gameId,
      opponent: "",
      updated: false,
      skipped: true,
      reason: "Jogo não encontrado."
    };
  }

  return syncGameScore(game, options);
}

async function syncGameScore(
  game: ScoreSyncGame,
  options: { ignoreInterval?: boolean; allowFinalized?: boolean } = {}
): Promise<SyncResult> {
  const now = new Date();

  if (!game.apiFootballFixtureId) {
    return {
      gameId: game.id,
      opponent: game.opponent,
      updated: false,
      skipped: true,
      reason: "Sem Fixture ID API-Football."
    };
  }

  if (game.finishedAt && !options.allowFinalized) {
    return {
      gameId: game.id,
      opponent: game.opponent,
      updated: false,
      skipped: true,
      reason: "Jogo já encerrado."
    };
  }

  if (!isInsideSyncWindow(game.kickoffAt, now) && !options.allowFinalized) {
    return {
      gameId: game.id,
      opponent: game.opponent,
      updated: false,
      skipped: true,
      reason: "Fora da janela de sincronização: começa no horário do jogo e termina 2h depois."
    };
  }

  if (!options.ignoreInterval && !isDueForSync(game, now)) {
    return {
      gameId: game.id,
      opponent: game.opponent,
      updated: false,
      skipped: true,
      reason: "Sincronização feita há menos de 5 minutos."
    };
  }

  const apiKey = await getApiFootballKey();

  if (!apiKey) {
    return {
      gameId: game.id,
      opponent: game.opponent,
      updated: false,
      skipped: true,
      reason: "API Key API-Football não configurada."
    };
  }

  try {
    const parsed = await fetchApiFootballScore(game, apiKey);

    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: {
        brazilScore: parsed.brazilScore,
        opponentScore: parsed.opponentScore,
        status: parsed.nextStatus,
        apiFootballStatusShort: parsed.statusShort,
        apiFootballStatusLong: parsed.statusLong,
        apiFootballElapsed: parsed.elapsed,
        scoreLastSyncedAt: now,
        scoreSyncStatus:
          parsed.statusLong || parsed.statusShort || "Placar sincronizado pela API-Football.",
        scoreSyncError: null,
        finishedAt: parsed.isFinal ? now : undefined
      },
      select: {
        id: true
      }
    });

    if (parsed.isFinal) {
      await finalizeGamePrizeSnapshot(updatedGame.id, now);
    }

    return {
      gameId: game.id,
      opponent: game.opponent,
      updated: true,
      skipped: false,
      scoreLabel: `${parsed.brazilScore} x ${parsed.opponentScore}`,
      status: parsed.nextStatus
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao sincronizar placar.";

    await prisma.game.update({
      where: { id: game.id },
      data: {
        scoreLastSyncedAt: now,
        scoreSyncError: message
      },
      select: {
        id: true
      }
    });

    return {
      gameId: game.id,
      opponent: game.opponent,
      updated: false,
      skipped: false,
      error: message
    };
  }
}

export async function syncEligibleGameScores(
  options: { ignoreInterval?: boolean; allowFinalized?: boolean } = {}
) {
  const games = await prisma.game.findMany({
    where: {
      apiFootballFixtureId: {
        not: null
      },
      finishedAt: options.allowFinalized ? undefined : null
    },
    select: scoreSyncGameSelect
  });

  return Promise.all(games.map((game) => syncGameScore(game, options)));
}

export async function syncDueGameScores() {
  await syncEligibleGameScores();
}
