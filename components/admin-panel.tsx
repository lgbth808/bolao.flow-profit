"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AdminGame, AdminPoolData } from "@/lib/types";
import { formatBrasiliaDateTime, toBrasiliaDateTimeLocal } from "@/lib/datetime";
import { getOpponentFlag, WORLD_CUP_2026_TEAMS } from "@/lib/flags";

type ApiResult<T> = T & {
  error?: string;
};

type FixtureCandidate = {
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
  suggestedStatus: "ABERTO" | "ENCERRADO";
};

type TeamCandidate = {
  id: number;
  name: string;
  code: string | null;
  country: string | null;
  national: boolean | null;
  logo: string | null;
};

type LeagueCandidate = {
  id: number;
  name: string;
  type: string | null;
  country: string | null;
  logo: string | null;
  season: number | null;
};

type WhatsappConfigForm = {
  baseUrl: string;
  instanceName: string;
  apiKey: string;
  apiKeyConfigured: boolean;
  siteUrl: string;
  testNumber: string;
  testMessage: string;
};

type AdminSection =
  | "pools"
  | "api"
  | "whatsapp"
  | "games"
  | "players"
  | "finance"
  | "predictions"
  | "audit";

type AdminModal = "pool" | "game" | null;
type PaymentFilter = "TODOS" | "PAGO" | "PENDENTE";

const LEGACY_PREDICTION_RULE =
  "Vale apenas para palpites de 1º e 2º tempos.";
const DEFAULT_PREDICTION_RULE =
  "Vale para o placar do 1º e 2º tempos + prorrogação, caso haja.";
const AUTO_UPDATE_STORAGE_KEY = "bolao-d-rosa-api-football-auto-update";

function formatDateTime(value: string) {
  return formatBrasiliaDateTime(value);
}

function displayPredictionRule(value: string) {
  return value === LEGACY_PREDICTION_RULE ? DEFAULT_PREDICTION_RULE : value;
}

function toDateTimeLocal(value: string) {
  return toBrasiliaDateTimeLocal(value);
}

function nullableScore(value: FormDataEntryValue | null) {
  if (value === null || String(value).trim() === "") {
    return null;
  }

  return Number(value);
}

function formatDecimalInput(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function auditActionLabel(action: string) {
  return action === "EXCLUIDO" ? "EXCLUÍDO" : action;
}

function gamePayload(form: HTMLFormElement) {
  const formData = new FormData(form);

  return {
    poolId: String(formData.get("poolId") ?? ""),
    opponent: String(formData.get("opponent") ?? ""),
    phase: String(formData.get("phase") ?? ""),
    kickoffAt: String(formData.get("kickoffAt") ?? ""),
    valorBolao: String(formData.get("valorBolao") ?? "0"),
    scoreSourceUrl: String(formData.get("scoreSourceUrl") ?? ""),
    apiFootballFixtureId: String(formData.get("apiFootballFixtureId") ?? ""),
    predictionRule:
      displayPredictionRule(
        String(formData.get("predictionRule") ?? "").trim()
      ) || DEFAULT_PREDICTION_RULE,
    status: String(formData.get("status") ?? "ABERTO"),
    brazilScore: nullableScore(formData.get("brazilScore")),
    opponentScore: nullableScore(formData.get("opponentScore")),
    hidePredictionsUntilLocked: formData.get("hidePredictionsUntilLocked") === "on"
  };
}

async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResult<T>;

  if (!response.ok) {
    throw new Error(payload.error ?? "Erro inesperado.");
  }

  return payload as T;
}

function statusForForm(status: string) {
  return status === "ABERTO" ? "ABERTO" : "ENCERRADO";
}

function normalizeFilterText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function matchesPaymentFilter(isPaid: boolean, filter: PaymentFilter) {
  if (filter === "PAGO") {
    return isPaid;
  }

  if (filter === "PENDENTE") {
    return !isPaid;
  }

  return true;
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-coal">
      {label}
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 rounded-md border border-line px-3 text-sm font-normal text-ink outline-none transition focus:border-field focus:ring-2 focus:ring-field/15 ${
        props.className ?? ""
      }`}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 rounded-md border border-line bg-white px-3 text-sm font-normal text-ink outline-none transition focus:border-field focus:ring-2 focus:ring-field/15 ${
        props.className ?? ""
      }`}
    />
  );
}

function OpponentField({
  defaultValue = "",
  value,
  onValueChange
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const opponentOptions = WORLD_CUP_2026_TEAMS.filter(
    (team) => team.name !== "Brasil"
  );
  const [internalOpponent, setInternalOpponent] = useState(defaultValue);
  const opponent = value ?? internalOpponent;
  const hasKnownOpponent = opponentOptions.some(
    (team) => team.name === opponent
  );
  const isCustomOpponent = opponent !== "" && !hasKnownOpponent;
  function handleOpponentChange(nextValue: string) {
    if (value === undefined) {
      setInternalOpponent(nextValue);
    }

    onValueChange?.(nextValue);
  }

  return (
    <Field label="Adversário">
      <div className="grid grid-cols-[52px_1fr] gap-2">
        <div className="flex h-10 items-center justify-center rounded-md border border-line bg-mist text-2xl">
          {getOpponentFlag(opponent)}
        </div>
        <SelectInput
          name="opponent"
          value={opponent}
          onChange={(event) => handleOpponentChange(event.target.value)}
          required
        >
          <option value="">Selecione a seleção</option>
          {isCustomOpponent ? (
            <option value={opponent}>{opponent}</option>
          ) : null}
          {opponentOptions.map((team) => (
            <option key={team.name} value={team.name}>
              {team.flag} {team.name}
            </option>
          ))}
        </SelectInput>
      </div>
    </Field>
  );
}

function ScoreFields({ game }: { game?: AdminGame }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Placar Brasil">
        <TextInput
          name="brazilScore"
          type="number"
          min={0}
          max={30}
          defaultValue={game?.brazilScore ?? 0}
        />
      </Field>
      <Field label="Placar adversário">
        <TextInput
          name="opponentScore"
          type="number"
          min={0}
          max={30}
          defaultValue={game?.opponentScore ?? 0}
        />
      </Field>
    </div>
  );
}

export function AdminPanel({ initialData }: { initialData: AdminPoolData }) {
  const [data, setData] = useState(initialData);
  const [activeSection, setActiveSection] = useState<AdminSection>("pools");
  const [activeModal, setActiveModal] = useState<AdminModal>(null);
  const [apiKey, setApiKey] = useState("");
  const [fixtureCandidates, setFixtureCandidates] = useState<FixtureCandidate[]>([]);
  const [teamCandidates, setTeamCandidates] = useState<TeamCandidate[]>([]);
  const [leagueCandidates, setLeagueCandidates] = useState<LeagueCandidate[]>([]);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsappConfigForm>({
    baseUrl: "",
    instanceName: "",
    apiKey: "",
    apiKeyConfigured: initialData.whatsappConfigured,
    siteUrl: "",
    testNumber: "",
    testMessage: ""
  });
  const [fixturePoolId, setFixturePoolId] = useState(
    initialData.adminPools[0]?.id ?? ""
  );
  const [fixtureValue, setFixtureValue] = useState("20,00");
  const [newGameOpponent, setNewGameOpponent] = useState("");
  const [newGamePhase, setNewGamePhase] = useState("");
  const [newGameKickoffAt, setNewGameKickoffAt] = useState("");
  const [newGameFixtureId, setNewGameFixtureId] = useState("");
  const [gameModalFixtureCandidates, setGameModalFixtureCandidates] = useState<
    FixtureCandidate[]
  >([]);
  const [gameModalFixtureStatus, setGameModalFixtureStatus] = useState("");
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [financeSearch, setFinanceSearch] = useState("");
  const [financeGameId, setFinanceGameId] = useState("");
  const [financePaymentFilter, setFinancePaymentFilter] =
    useState<PaymentFilter>("TODOS");
  const [predictionSearch, setPredictionSearch] = useState("");
  const [predictionGameId, setPredictionGameId] = useState("");
  const [predictionPaymentFilter, setPredictionPaymentFilter] =
    useState<PaymentFilter>("TODOS");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const filteredFinanceEntries = useMemo(() => {
    const search = normalizeFilterText(financeSearch);

    return data.adminFinanceEntries.filter((entry) => {
      const searchText = normalizeFilterText(
        `${entry.playerName} ${entry.playerWhatsapp} ${entry.gameLabel} ${entry.predictionLabel} ${entry.amountFormatted}`
      );

      return (
        (!search || searchText.includes(search)) &&
        (!financeGameId || entry.gameId === financeGameId) &&
        matchesPaymentFilter(entry.isPaid, financePaymentFilter)
      );
    });
  }, [
    data.adminFinanceEntries,
    financeGameId,
    financePaymentFilter,
    financeSearch
  ]);

  const filteredAdminPredictions = useMemo(() => {
    const search = normalizeFilterText(predictionSearch);

    return data.adminPredictions.filter((prediction) => {
      const searchText = normalizeFilterText(
        `${prediction.playerName} ${prediction.playerWhatsapp} ${prediction.gameLabel} ${prediction.predictionLabel}`
      );

      return (
        (!search || searchText.includes(search)) &&
        (!predictionGameId || prediction.gameId === predictionGameId) &&
        matchesPaymentFilter(prediction.isPaid, predictionPaymentFilter)
      );
    });
  }, [
    data.adminPredictions,
    predictionGameId,
    predictionPaymentFilter,
    predictionSearch
  ]);

  async function refresh() {
    const response = await fetch("/api/admin", { cache: "no-store" });
    setData(await readApi<AdminPoolData>(response));
  }

  async function loadWhatsappConfig() {
    const response = await fetch("/api/admin/settings/whatsapp", {
      cache: "no-store"
    });
    const result = await readApi<{ config: WhatsappConfigForm }>(response);

    setWhatsappConfig((current) => ({
      ...result.config,
      apiKey: current.apiKey
    }));
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 60_000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadWhatsappConfig().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAutoUpdateEnabled(
      window.localStorage.getItem(AUTO_UPDATE_STORAGE_KEY) === "true"
    );
  }, []);

  useEffect(() => {
    if (!fixturePoolId && data.adminPools[0]?.id) {
      setFixturePoolId(data.adminPools[0].id);
    }
  }, [data.adminPools, fixturePoolId]);

  useEffect(() => {
    if (!autoUpdateEnabled) {
      return;
    }

    const timer = window.setInterval(() => {
      runAutoSync().catch(() => undefined);
    }, 5 * 60_000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoUpdateEnabled]);

  async function submitJson<T>(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    payload: unknown,
    successMessage: string
  ) {
    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: payload === undefined ? undefined : JSON.stringify(payload)
      });

      const result = await readApi<T & { whatsappWarning?: string | null }>(
        response
      );
      await refresh();
      setMessage(result.whatsappWarning || successMessage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro na operação.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitJson("/api/admin/games", "POST", gamePayload(event.currentTarget), "Jogo cadastrado.");
    event.currentTarget.reset();
    resetNewGameFormState();
    setActiveModal(null);
  }

  async function handleSearchFixtures(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsBusy(true);
    setError("");
    setMessage("");
    setFixtureCandidates([]);

    try {
      const response = await fetch("/api/admin/fixtures/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leagueId: String(formData.get("leagueId") ?? ""),
          season: String(formData.get("season") ?? ""),
          teamId: String(formData.get("teamId") ?? ""),
          date: String(formData.get("date") ?? "")
        })
      });
      const result = await readApi<{ fixtures: FixtureCandidate[] }>(response);

      setFixtureCandidates(result.fixtures);
      setMessage(
        result.fixtures.length === 0
          ? "Nenhum jogo do Brasil encontrado para esses filtros."
          : `${result.fixtures.length} jogo(s) encontrado(s).`
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao buscar jogos.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSearchTeams(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsBusy(true);
    setError("");
    setMessage("");
    setTeamCandidates([]);

    try {
      const response = await fetch("/api/admin/teams/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search: String(formData.get("search") ?? ""),
          country: String(formData.get("country") ?? ""),
          code: String(formData.get("code") ?? "")
        })
      });
      const result = await readApi<{ teams: TeamCandidate[] }>(response);

      setTeamCandidates(result.teams);
      setMessage(
        result.teams.length === 0
          ? "Nenhum time encontrado para esses filtros."
          : `${result.teams.length} time(s) encontrado(s).`
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao buscar times.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSearchLeagues(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsBusy(true);
    setError("");
    setMessage("");
    setLeagueCandidates([]);

    try {
      const response = await fetch("/api/admin/leagues/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search: String(formData.get("search") ?? ""),
          country: String(formData.get("country") ?? ""),
          season: String(formData.get("season") ?? ""),
          current: formData.get("current") === "on"
        })
      });
      const result = await readApi<{ leagues: LeagueCandidate[] }>(response);

      setLeagueCandidates(result.leagues);
      setMessage(
        result.leagues.length === 0
          ? "Nenhuma liga/campeonato encontrada para esses filtros."
          : `${result.leagues.length} liga(s)/campeonato(s) encontrado(s).`
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao buscar ligas.");
    } finally {
      setIsBusy(false);
    }
  }

  async function saveWhatsappSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitJson(
      "/api/admin/settings/whatsapp",
      "POST",
      whatsappConfig,
      "Configuração WhatsApp salva."
    );
    setWhatsappConfig((current) => ({ ...current, apiKey: "" }));
    await loadWhatsappConfig();
  }

  async function testWhatsappSettings() {
    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings/whatsapp/test", {
        method: "POST"
      });
      const result = await readApi<{
        sent: boolean;
        skipped: boolean;
        warning?: string;
      }>(response);

      setMessage(
        result.warning ??
          (result.sent
            ? "Mensagem de teste enviada."
            : "WhatsApp não enviado: confira configuração e número de teste.")
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Erro ao testar WhatsApp."
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function createGameFromFixture(fixture: FixtureCandidate) {
    await submitJson(
      "/api/admin/games",
      "POST",
      {
        poolId: fixturePoolId,
        opponent: fixture.opponent,
        phase: fixture.round,
        kickoffAt: fixture.kickoffAt,
        valorBolao: fixtureValue,
        apiFootballFixtureId: String(fixture.fixtureId),
        predictionRule: DEFAULT_PREDICTION_RULE,
        status: statusForForm(fixture.suggestedStatus),
        brazilScore: fixture.brazilScore,
        opponentScore: fixture.opponentScore,
        hidePredictionsUntilLocked: true
      },
      `Jogo Brasil x ${fixture.opponent} cadastrado.`
    );
  }

  function resetNewGameFormState() {
    setNewGameOpponent("");
    setNewGamePhase("");
    setNewGameKickoffAt("");
    setNewGameFixtureId("");
    setGameModalFixtureCandidates([]);
    setGameModalFixtureStatus("");
  }

  function openGameModal() {
    resetNewGameFormState();
    setActiveModal("game");
  }

  async function searchFixturesForGameModal(form: HTMLFormElement | null) {
    if (!form) {
      return;
    }

    const formData = new FormData(form);
    const kickoffAt = String(formData.get("kickoffAt") ?? "");

    setIsBusy(true);
    setError("");
    setGameModalFixtureStatus("");
    setGameModalFixtureCandidates([]);

    try {
      const response = await fetch("/api/admin/fixtures/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leagueId: String(formData.get("apiFootballLeagueId") ?? ""),
          season: String(formData.get("apiFootballSeason") ?? ""),
          teamId:
            String(formData.get("apiFootballBrazilTeamId") ?? "") ||
            String(formData.get("apiFootballOpponentTeamId") ?? ""),
          date: kickoffAt ? kickoffAt.slice(0, 10) : ""
        })
      });
      const result = await readApi<{ fixtures: FixtureCandidate[] }>(response);

      setGameModalFixtureCandidates(result.fixtures);
      setGameModalFixtureStatus(
        result.fixtures.length === 0
          ? "Nenhum fixture encontrado para esses dados."
          : "Selecione o fixture correto para preencher o jogo."
      );
    } catch (caught) {
      setGameModalFixtureStatus("");
      setError(
        caught instanceof Error
          ? caught.message
          : "Erro ao buscar fixture para este jogo."
      );
    } finally {
      setIsBusy(false);
    }
  }

  function applyFixtureToGameModal(fixture: FixtureCandidate) {
    setNewGameOpponent(fixture.opponent);
    setNewGamePhase(fixture.round);
    setNewGameKickoffAt(toDateTimeLocal(fixture.kickoffAt));
    setNewGameFixtureId(String(fixture.fixtureId));
    setGameModalFixtureCandidates([]);
    setGameModalFixtureStatus(
      `Fixture ${fixture.fixtureId} aplicado ao cadastro do jogo.`
    );
  }

  async function handleCreatePool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await submitJson(
      "/api/admin/pools",
      "POST",
      {
        name: String(formData.get("name") ?? ""),
        pixKey: String(formData.get("pixKey") ?? ""),
        pixOwner: String(formData.get("pixOwner") ?? "")
      },
      "Bolão cadastrado."
    );
    event.currentTarget.reset();
    setActiveModal(null);
  }

  async function handleUpdatePool(
    event: FormEvent<HTMLFormElement>,
    poolId: string
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await submitJson(
      `/api/admin/pools/${poolId}`,
      "PATCH",
      {
        name: String(formData.get("name") ?? ""),
        pixKey: String(formData.get("pixKey") ?? ""),
        pixOwner: String(formData.get("pixOwner") ?? "")
      },
      "Bolão atualizado."
    );
  }

  async function deletePool(poolId: string) {
    if (
      !window.confirm(
        "Excluir este bolão? Os jogos e palpites ligados a ele também serão removidos."
      )
    ) {
      return;
    }

    await submitJson(
      `/api/admin/pools/${poolId}`,
      "DELETE",
      undefined,
      "Bolão excluído."
    );
  }

  async function saveApiKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitJson(
      "/api/admin/settings/api-football-key",
      "POST",
      { apiKey },
      "API Key API-Football salva."
    );
    setApiKey("");
  }

  async function handleUpdateGame(
    event: FormEvent<HTMLFormElement>,
    gameId: string
  ) {
    event.preventDefault();
    await submitJson(
      `/api/admin/games/${gameId}`,
      "PATCH",
      gamePayload(event.currentTarget),
      "Jogo atualizado."
    );
  }

  async function closeGame(gameId: string) {
    await submitJson(
      `/api/admin/games/${gameId}`,
      "PATCH",
      { status: "ENCERRADO" },
      "Jogo finalizado."
    );
  }

  async function syncScore(gameId: string) {
    await submitJson(
      "/api/admin/scores/sync",
      "POST",
      { gameId },
      "Sincronização do placar executada."
    );
  }

  async function runAutoSync() {
    setError("");

    try {
      const response = await fetch("/api/admin/scores/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false })
      });

      await readApi(response);
      await refresh();
      setMessage("Atualização automática executada.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Erro na atualização automática."
      );
    }
  }

  function startAutoUpdate() {
    window.localStorage.setItem(AUTO_UPDATE_STORAGE_KEY, "true");
    setAutoUpdateEnabled(true);
    runAutoSync().catch(() => undefined);
  }

  function stopAutoUpdate() {
    window.localStorage.removeItem(AUTO_UPDATE_STORAGE_KEY);
    setAutoUpdateEnabled(false);
    setMessage("Atualização automática desativada.");
  }

  async function deleteGame(gameId: string) {
    if (!window.confirm("Excluir este jogo e todos os palpites dele?")) {
      return;
    }

    await submitJson(
      `/api/admin/games/${gameId}`,
      "DELETE",
      undefined,
      "Jogo excluído."
    );
  }

  async function handleUpdatePlayer(
    event: FormEvent<HTMLFormElement>,
    playerId: string
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await submitJson(
      `/api/admin/players/${playerId}`,
      "PATCH",
      {
        name: String(formData.get("name") ?? ""),
        whatsapp: String(formData.get("whatsapp") ?? "")
      },
      "Palpiteiro atualizado."
    );
  }

  async function resetPlayerPin(playerId: string) {
    await submitJson(
      `/api/admin/players/${playerId}`,
      "PATCH",
      { resetPin: true },
      "Senha resetada. O palpiteiro criará nova senha no próximo acesso."
    );
  }

  async function deletePlayer(playerId: string) {
    if (!window.confirm("Excluir este palpiteiro e todos os palpites dele?")) {
      return;
    }

    await submitJson(
      `/api/admin/players/${playerId}`,
      "DELETE",
      undefined,
      "Palpiteiro excluído."
    );
  }

  async function setPredictionPaid(predictionId: string, paid: boolean) {
    await submitJson(
      `/api/admin/predictions/${predictionId}/payment`,
      "PATCH",
      { paid },
      paid ? "Pagamento baixado." : "Pagamento marcado como pendente."
    );
  }

  function financeEntriesForPlayer(playerId: string) {
    return data.adminFinanceEntries.filter((entry) => entry.playerId === playerId);
  }

  function winnerForGame(gameId: string) {
    return data.winners.find((winner) => winner.gameId === gameId);
  }

  return (
    <main
      className="admin-brand-bg min-h-screen bg-fixed"
    >
      <header className="border-b border-canary/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo_simbolo.png"
              alt="Símbolo Bet Barão"
              width={56}
              height={56}
              className="h-12 w-12 shrink-0 rounded-md object-contain shadow-sm"
              priority
            />
            <div>
              <h1 className="text-xl font-black text-ink sm:text-2xl">
                bet <span className="text-field">BARÃO</span>{" "}
                <span className="text-rose">admin</span>
              </h1>
              <p className="mt-1 text-sm text-coal/70">
                Bolões, jogos, placares, pagamentos, ocultação e conferências.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-field hover:text-field"
            >
              Página pública
            </a>
            <form action="/api/admin/logout" method="post">
              <button className="h-10 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100">
                Sair
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 text-sm font-semibold lg:px-6">
          {[
            ["pools", "Bolões"],
            ["api", "API-Football"],
            ["whatsapp", "WhatsApp"],
            ["games", "Jogos"],
            ["players", "Palpiteiros"],
            ["finance", "Financeiro"],
            ["predictions", "Palpites"],
            ["audit", "Auditoria"]
          ].map(([section, label]) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section as AdminSection)}
              className={`shrink-0 rounded-md border px-3 py-2 transition ${
                activeSection === section
                  ? "border-field bg-field text-white"
                  : "border-line bg-mist text-ink hover:border-field hover:text-field"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[0.95fr_1.35fr] lg:px-6">
        {activeSection === "pools" ? (
        <section id="admin-boloes" className="rounded-lg border border-line bg-white p-5 shadow-panel lg:col-span-2">
          <h2 className="text-xl font-semibold text-ink">Bolões</h2>
          <p className="mt-1 text-sm text-coal/70">
            Separe apostas por grupo de amigos e defina o PIX de cada bolão.
          </p>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => setActiveModal("pool")}
              className="h-11 rounded-md bg-field px-4 text-sm font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
            >
              Cadastrar bolão
            </button>

          <div className="mt-5 grid gap-3">
            {data.adminPools.length === 0 ? (
              <div className="rounded-md border border-line bg-mist/70 p-4 text-sm text-coal/70">
                Nenhum bolão cadastrado.
              </div>
            ) : null}
            {data.adminPools.map((pool) => (
              <details key={pool.id} className="rounded-md border border-line p-3">
                <summary className="cursor-pointer text-sm font-semibold text-ink">
                  {pool.name}
                </summary>
              <form
                onSubmit={(event) => handleUpdatePool(event, pool.id)}
                className="mt-3"
              >
                <div className="grid gap-3">
                  <Field label="Nome">
                    <TextInput name="name" defaultValue={pool.name} required />
                  </Field>
                  <Field label="PIX">
                    <TextInput name="pixKey" defaultValue={pool.pixKey} required />
                  </Field>
                  <Field label="Titular">
                    <TextInput
                      name="pixOwner"
                      defaultValue={pool.pixOwner}
                      required
                    />
                  </Field>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    disabled={isBusy}
                    className="h-9 rounded-md bg-ink px-3 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:bg-coal/30"
                  >
                    Salvar bolão
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => deletePool(pool.id)}
                    className="h-9 rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:text-red-300"
                  >
                    Excluir bolão
                  </button>
                </div>
              </form>
              </details>
            ))}
          </div>
        </section>
        ) : null}

        {activeSection === "api" ? (
        <section id="admin-api" className="rounded-lg border border-line bg-white p-5 shadow-panel lg:col-span-2">
          <h2 className="text-xl font-semibold text-ink">API-Football</h2>
          <p className="mt-1 text-sm text-coal/70">
            A chave fica salva no MVP local. Em produção, use backend/serverless
            para proteger a chave.
          </p>

          <form onSubmit={saveApiKey} className="mt-5 grid gap-3">
            <Field label="API Key API-Football">
              <TextInput
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={
                  data.apiFootballKeyConfigured
                    ? "API Key já salva. Digite outra para substituir."
                    : "Cole a chave da API-Sports"
                }
                type="password"
              />
            </Field>
            <button
              disabled={isBusy || !apiKey.trim()}
              className="h-11 rounded-md bg-field px-4 text-sm font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
            >
              Salvar API Key
            </button>
          </form>

          <div className="mt-4 rounded-md border border-field/15 bg-field/5 p-3 text-sm">
            <p className="font-semibold text-ink">
              Status:{" "}
              {data.apiFootballKeyConfigured
                ? "API Key configurada"
                : "API Key pendente"}
            </p>
            <p className="mt-1 text-coal/70">
              A atualização automática consulta apenas jogos com Fixture ID e
              começa somente no horário cadastrado do jogo.
            </p>
          </div>

          <details className="mt-4 rounded-md border border-line bg-white p-3">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Buscar League ID / campeonato na API-Football
            </summary>
            <p className="mt-2 text-sm text-coal/70">
              Busque ligas e campeonatos para copiar o ID numérico usado em
              fixtures. Ex.: search=World Cup, country=World ou season=2026.
            </p>
            <form onSubmit={handleSearchLeagues} className="mt-4 grid gap-3 md:grid-cols-4">
              <Field label="Nome">
                <TextInput name="search" placeholder="World Cup" />
              </Field>
              <Field label="País">
                <TextInput name="country" placeholder="World" />
              </Field>
              <Field label="Season">
                <TextInput name="season" inputMode="numeric" placeholder="2026" />
              </Field>
              <label className="flex items-center gap-2 self-end text-sm font-semibold text-coal">
                <input
                  name="current"
                  type="checkbox"
                  className="h-4 w-4 accent-field"
                />
                Apenas atual
              </label>
              <button
                disabled={isBusy || !data.apiFootballKeyConfigured}
                className="h-11 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:bg-coal/30 md:col-span-4"
              >
                Buscar ligas/campeonatos
              </button>
            </form>

            {leagueCandidates.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {leagueCandidates.map((league) => (
                  <div
                    key={`${league.id}-${league.season ?? "season"}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-mist/60 p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-ink">
                        {league.name}
                        {league.type ? ` · ${league.type}` : ""}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-coal/60">
                        League ID {league.id}
                        {league.country ? ` · ${league.country}` : ""}
                        {league.season ? ` · season ${league.season}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(String(league.id))}
                      className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-field hover:text-field"
                    >
                      Copiar ID
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </details>

          <details className="mt-4 rounded-md border border-line bg-white p-3">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Buscar Team ID na API-Football
            </summary>
            <p className="mt-2 text-sm text-coal/70">
              Use o endpoint Teams para localizar IDs numéricos antes de buscar
              fixtures. Ex.: search=Brazil, country=Brazil ou code=BRA.
            </p>
            <form onSubmit={handleSearchTeams} className="mt-4 grid gap-3 md:grid-cols-3">
              <Field label="Nome">
                <TextInput name="search" placeholder="Brazil" />
              </Field>
              <Field label="País">
                <TextInput name="country" placeholder="Brazil" />
              </Field>
              <Field label="Código">
                <TextInput name="code" placeholder="BRA" />
              </Field>
              <button
                disabled={isBusy || !data.apiFootballKeyConfigured}
                className="h-11 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:bg-coal/30 md:col-span-3"
              >
                Buscar times
              </button>
            </form>

            {teamCandidates.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {teamCandidates.map((team) => (
                  <div
                    key={team.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-mist/60 p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-ink">
                        {team.name} {team.code ? `· ${team.code}` : ""}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-coal/60">
                        Team ID {team.id}
                        {team.country ? ` · ${team.country}` : ""}
                        {team.national ? " · seleção" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(String(team.id))}
                      className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-field hover:text-field"
                    >
                      Copiar ID
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </details>

          <details className="mt-4 rounded-md border border-line bg-white p-3">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Buscar jogos na API-Football
            </summary>
            <p className="mt-2 text-sm text-coal/70">
              Use IDs numéricos da API-Football. O erro do tutorial ocorre
              quando se usa texto como league=World Cup 2026 ou team=BRAZIL.
            </p>
            <form onSubmit={handleSearchFixtures} className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Bolão onde o jogo será criado">
                <SelectInput
                  value={fixturePoolId}
                  onChange={(event) => setFixturePoolId(event.target.value)}
                  required
                >
                  {data.adminPools.length === 0 ? (
                    <option value="">Cadastre um bolão primeiro</option>
                  ) : null}
                  {data.adminPools.map((pool) => (
                    <option key={pool.id} value={pool.id}>
                      {pool.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Valor por palpite">
                <TextInput
                  value={fixtureValue}
                  onChange={(event) => setFixtureValue(event.target.value)}
                  inputMode="decimal"
                  placeholder="20,00"
                />
              </Field>
              <Field label="League ID">
                <TextInput
                  name="leagueId"
                  inputMode="numeric"
                  placeholder="Ex.: 1"
                  required
                />
              </Field>
              <Field label="Season">
                <TextInput
                  name="season"
                  inputMode="numeric"
                  placeholder="2026"
                  defaultValue="2026"
                  required
                />
              </Field>
              <Field label="Team ID do Brasil">
                <TextInput
                  name="teamId"
                  inputMode="numeric"
                  placeholder="Ex.: ID numérico do Brasil"
                  required
                />
              </Field>
              <Field label="Data do jogo">
                <TextInput name="date" type="date" />
              </Field>
              <button
                disabled={isBusy || !data.apiFootballKeyConfigured}
                className="h-11 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:bg-coal/30 md:col-span-2"
              >
                Buscar jogos
              </button>
            </form>

            {fixtureCandidates.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {fixtureCandidates.map((fixture) => (
                  <div
                    key={fixture.fixtureId}
                    className="rounded-md border border-line bg-mist/60 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">
                          Brasil x {fixture.opponent}
                        </p>
                        <p className="mt-1 text-coal/70">
                          {fixture.homeName} x {fixture.awayName} ·{" "}
                          {formatDateTime(fixture.kickoffAt)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-coal/60">
                          Fixture {fixture.fixtureId} · {fixture.round} ·{" "}
                          {fixture.statusLong ?? fixture.statusShort ?? "sem status"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isBusy || !fixturePoolId}
                        onClick={() => createGameFromFixture(fixture)}
                        className="h-9 rounded-md bg-field px-3 text-xs font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
                      >
                        Cadastrar este jogo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </details>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={autoUpdateEnabled}
              onClick={startAutoUpdate}
              className="h-10 rounded-md border border-field/30 bg-field/5 px-4 text-sm font-semibold text-field transition hover:bg-field/10 disabled:text-coal/35"
            >
              Ativar atualização automática
            </button>
            <button
              type="button"
              disabled={!autoUpdateEnabled}
              onClick={stopAutoUpdate}
              className="h-10 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-canary disabled:text-coal/35"
            >
              Desativar atualização automática
            </button>
          </div>
        </section>
        ) : null}

        {activeSection === "whatsapp" ? (
        <section id="admin-whatsapp" className="rounded-lg border border-line bg-white p-5 shadow-panel lg:col-span-2">
          <h2 className="text-xl font-semibold text-ink">
            WhatsApp / Evolution API
          </h2>
          <p className="mt-1 text-sm text-coal/70">
            Envia avisos de novo palpite, edição, exclusão e novo jogo. O
            envio não bloqueia o salvamento se a API falhar.
          </p>
          <p className="mt-3 rounded-md border border-canary/30 bg-canary/15 px-3 py-2 text-sm font-semibold text-ink">
            MVP local: a chave fica salva no banco do projeto. Em produção, o
            envio deve passar por backend ou serverless function para proteger
            a API Key.
          </p>

          <form
            onSubmit={saveWhatsappSettings}
            className="mt-5 grid gap-3 md:grid-cols-2"
          >
            <Field label="URL base da Evolution API">
              <TextInput
                value={whatsappConfig.baseUrl}
                onChange={(event) =>
                  setWhatsappConfig((current) => ({
                    ...current,
                    baseUrl: event.target.value
                  }))
                }
                placeholder="https://sua-evolution-api.com"
              />
            </Field>
            <Field label="Instance Name">
              <TextInput
                value={whatsappConfig.instanceName}
                onChange={(event) =>
                  setWhatsappConfig((current) => ({
                    ...current,
                    instanceName: event.target.value
                  }))
                }
                placeholder="minha-instancia"
              />
            </Field>
            <Field label="API Key">
              <TextInput
                value={whatsappConfig.apiKey}
                onChange={(event) =>
                  setWhatsappConfig((current) => ({
                    ...current,
                    apiKey: event.target.value
                  }))
                }
                type="password"
                placeholder={
                  whatsappConfig.apiKeyConfigured
                    ? "API Key já salva. Digite outra para substituir."
                    : "Cole a API Key da Evolution API"
                }
              />
            </Field>
            <Field label="URL do site do bolão">
              <TextInput
                value={whatsappConfig.siteUrl}
                onChange={(event) =>
                  setWhatsappConfig((current) => ({
                    ...current,
                    siteUrl: event.target.value
                  }))
                }
                placeholder="https://bolao.flow-profit.com"
              />
            </Field>
            <Field label="Número de teste">
              <TextInput
                value={whatsappConfig.testNumber}
                onChange={(event) =>
                  setWhatsappConfig((current) => ({
                    ...current,
                    testNumber: event.target.value
                  }))
                }
                placeholder="91 98258-5313"
              />
            </Field>
            <Field label="Mensagem de teste">
              <TextInput
                value={whatsappConfig.testMessage}
                onChange={(event) =>
                  setWhatsappConfig((current) => ({
                    ...current,
                    testMessage: event.target.value
                  }))
                }
                placeholder="Teste do Bolão Copa 2026"
              />
            </Field>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button
                disabled={isBusy}
                className="h-11 rounded-md bg-field px-4 text-sm font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
              >
                Salvar configuração
              </button>
              <button
                type="button"
                disabled={isBusy || !data.whatsappConfigured}
                onClick={testWhatsappSettings}
                className="h-11 rounded-md border border-field/30 bg-field/5 px-4 text-sm font-semibold text-field transition hover:bg-field/10 disabled:text-coal/35"
              >
                Testar envio
              </button>
            </div>
          </form>

          <div className="mt-4 rounded-md border border-line bg-mist/60 p-3 text-sm">
            <p className="font-semibold text-ink">
              Status:{" "}
              {data.whatsappConfigured
                ? "Evolution API configurada"
                : "Evolution API pendente"}
            </p>
            <p className="mt-1 text-coal/70">
              Telefone enviado no formato 55DDDNUMERO. Se o número tiver 11
              dígitos, o sistema prefixa 55 automaticamente.
            </p>
          </div>
        </section>
        ) : null}

        {activeSection === "games" ? (
        <section id="admin-jogos" className="rounded-lg border border-line bg-white p-5 shadow-panel lg:col-span-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-ink">Jogos</h2>
            <p className="text-sm text-coal/70">
              Editar dados, inserir placar real e finalizar manualmente.
            </p>
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={openGameModal}
            className="mt-5 h-11 rounded-md bg-field px-4 text-sm font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
          >
            Cadastrar jogo
          </button>

          <div className="mt-5 grid gap-4">
            {data.adminGames.length === 0 ? (
              <div className="rounded-md border border-line bg-mist/70 p-4 text-sm text-coal/70">
                Nenhum jogo cadastrado.
              </div>
            ) : null}
            {data.adminGames.map((game) => (
              <details
                key={game.id}
                className="rounded-md border border-line bg-white p-4"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">
                        🇧🇷 Brasil x {game.opponentFlag} {game.opponent}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-coal/60">
                        {game.poolName ?? "Sem bolão"} · {game.phase}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="rounded-md bg-ink px-2.5 py-1 text-white">
                        {game.scoreLabel}
                      </span>
                      <span className="rounded-md bg-mist px-2.5 py-1 text-coal">
                        {game.statusLabel}
                      </span>
                      <span className="rounded-md bg-field/10 px-2.5 py-1 text-field">
                        {game.prizeAmountFormatted}
                      </span>
                    </div>
                  </div>
                </summary>
              <form
                onSubmit={(event) => handleUpdateGame(event, game.id)}
                className="mt-4"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Bolão">
                    <SelectInput name="poolId" defaultValue={game.poolId ?? ""}>
                      <option value="">Sem bolão</option>
                      {data.adminPools.map((pool) => (
                        <option key={pool.id} value={pool.id}>
                          {pool.name}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <OpponentField defaultValue={game.opponent} />
                  <Field label="Fase">
                    <TextInput name="phase" defaultValue={game.phase} required />
                  </Field>
                  <Field label="Data/hora">
                    <TextInput
                      name="kickoffAt"
                      type="datetime-local"
                      defaultValue={toDateTimeLocal(game.kickoffAt)}
                      required
                    />
                  </Field>
                  <Field label="Valor do bolão">
                    <TextInput
                      name="valorBolao"
                      defaultValue={formatDecimalInput(game.valorBolao)}
                      inputMode="decimal"
                    />
                  </Field>
                  <Field label="Fixture ID API-Football">
                    <TextInput
                      name="apiFootballFixtureId"
                      defaultValue={game.apiFootballFixtureId ?? ""}
                      placeholder="Ex.: 1234567"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Regra para os palpiteiros">
                    <TextInput
                      name="predictionRule"
                      defaultValue={displayPredictionRule(game.predictionRule)}
                      required
                    />
                  </Field>
                  <Field label="Status">
                    <SelectInput name="status" defaultValue={statusForForm(game.status)}>
                      <option value="ABERTO">Aberto</option>
                      <option value="ENCERRADO">Finalizado</option>
                    </SelectInput>
                  </Field>
                </div>

                <div className="mt-3">
                  <ScoreFields game={game} />
                </div>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-coal">
                    <input
                      name="hidePredictionsUntilLocked"
                      type="checkbox"
                      defaultChecked={game.hidePredictionsUntilLocked}
                      className="h-4 w-4 accent-field"
                    />
                    Ocultar antes do fechamento
                  </label>
                  <p className="text-xs font-semibold text-coal/60">
                    Início {formatDateTime(game.kickoffAt)} · bloqueio{" "}
                    {formatDateTime(game.lockAt)}
                  </p>
                </div>

                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-5">
                  <div className="rounded-md border border-line bg-mist/70 px-3 py-2">
                    <p className="text-xs font-semibold uppercase text-coal/55">
                      Bandeira
                    </p>
                    <p className="mt-1 text-xl">{game.opponentFlag}</p>
                  </div>
                  <div className="rounded-md border border-line bg-mist/70 px-3 py-2">
                    <p className="text-xs font-semibold uppercase text-coal/55">
                      Placar atual
                    </p>
                    <p className="mt-1 font-semibold text-ink">
                      {game.scoreLabel}
                    </p>
                  </div>
                  <div className="rounded-md border border-line bg-mist/70 px-3 py-2">
                    <p className="text-xs font-semibold uppercase text-coal/55">
                      Palpites carregados
                    </p>
                    <p className="mt-1 font-semibold text-ink">
                      {game.predictionCount}
                    </p>
                  </div>
                  <div className="rounded-md border border-line bg-mist/70 px-3 py-2">
                    <p className="text-xs font-semibold uppercase text-coal/55">
                      Pagos
                    </p>
                    <p className="mt-1 font-semibold text-field">
                      {game.paidPredictionCount}
                    </p>
                  </div>
                  <div className="rounded-md border border-line bg-mist/70 px-3 py-2">
                    <p className="text-xs font-semibold uppercase text-coal/55">
                      Prêmio atual
                    </p>
                    <p className="mt-1 font-semibold text-field">
                      {game.prizeAmountFormatted}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-md border border-line bg-mist/60 px-3 py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">
                        Vencedores e financeiro deste jogo
                      </p>
                      <p className="mt-1 text-xs font-semibold text-coal/60">
                        Pendentes de pagamento: {game.pendingPaymentCount}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection("predictions")}
                      className="h-9 rounded-md border border-field/30 bg-white px-3 text-xs font-semibold text-field transition hover:bg-field/10"
                    >
                      Abrir palpites carregados
                    </button>
                  </div>
                  {(() => {
                    const winner = winnerForGame(game.id);

                    if (!winner || winner.status === "PENDING_SCORE") {
                      return (
                        <p className="mt-3 rounded-md bg-white px-3 py-2 text-coal/70">
                          Aguardando placar final para calcular vencedores.
                        </p>
                      );
                    }

                    if (winner.status === "NO_WINNER") {
                      return (
                        <p className="mt-3 rounded-md bg-white px-3 py-2 text-coal/70">
                          Sem vencedor neste jogo.
                        </p>
                      );
                    }

                    return (
                      <div className="mt-3 grid gap-2">
                        {winner.winners.map((item) => (
                          <div
                            key={item.playerId}
                            className="flex flex-wrap justify-between gap-2 rounded-md bg-white px-3 py-2 text-field"
                          >
                            <span className="font-semibold">{item.name}</span>
                            <span>
                              Palpite {item.predictionLabel} · Rateio{" "}
                              {winner.shareAmountFormatted}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-3 rounded-md border border-field/15 bg-field/5 px-3 py-2 text-xs text-coal/75">
                  <p className="font-semibold text-ink">
                    Sync API-Football:{" "}
                    {game.apiFootballFixtureId
                      ? `Fixture ${game.apiFootballFixtureId}`
                      : "sem Fixture ID configurado"}
                  </p>
                  <p className="mt-1">
                    Última tentativa:{" "}
                    {game.scoreLastSyncedAt
                      ? formatDateTime(game.scoreLastSyncedAt)
                      : "nenhuma"}
                    {game.scoreSyncStatus ? ` · ${game.scoreSyncStatus}` : ""}
                    {game.apiFootballElapsed
                      ? ` · ${game.apiFootballElapsed}'`
                      : ""}
                  </p>
                  <p className="mt-1">
                    Status API:{" "}
                    {game.apiFootballStatusShort || game.apiFootballStatusLong
                      ? `${game.apiFootballStatusShort ?? ""} ${
                          game.apiFootballStatusLong ?? ""
                        }`.trim()
                      : "ainda não sincronizado"}
                  </p>
                  {game.scoreSyncError ? (
                    <p className="mt-1 font-semibold text-red-700">
                      Erro: {game.scoreSyncError}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    disabled={isBusy}
                    className="h-10 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:bg-coal/30"
                  >
                    Salvar alterações
                  </button>
                  <button
                    type="button"
                    disabled={isBusy || game.status !== "ABERTO"}
                    onClick={() => closeGame(game.id)}
                    className="h-10 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-canary disabled:text-coal/35"
                  >
                    Finalizar jogo
                  </button>
                  <button
                    type="button"
                    disabled={isBusy || !game.apiFootballFixtureId}
                    onClick={() => syncScore(game.id)}
                    className="h-10 rounded-md border border-field/30 bg-field/5 px-4 text-sm font-semibold text-field transition hover:bg-field/10 disabled:text-coal/35"
                  >
                    Buscar/Atualizar placar agora
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => deleteGame(game.id)}
                    className="h-10 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:text-red-300"
                  >
                    Excluir jogo
                  </button>
                </div>
              </form>
              </details>
            ))}
          </div>
        </section>
        ) : null}

        {activeSection === "players" ? (
        <section id="admin-jogadores" className="rounded-lg border border-line bg-white p-5 shadow-panel lg:col-span-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-ink">Palpiteiros</h2>
            <p className="text-sm text-coal/70">
              Cadastro do participante. Os valores ficam ligados a cada jogo
              apostado.
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            {data.adminPlayers.length === 0 ? (
              <div className="rounded-md border border-line bg-mist/70 p-4 text-sm text-coal/70">
                Nenhum palpiteiro cadastrado.
              </div>
            ) : null}
            {data.adminPlayers.map((player) => (
              <div
                key={player.id}
                className="rounded-lg border border-line bg-white p-3 shadow-sm"
              >
                <form
                  onSubmit={(event) => handleUpdatePlayer(event, player.id)}
                  className="grid gap-3 xl:grid-cols-[minmax(150px,1fr)_minmax(160px,1fr)_minmax(150px,1fr)_auto] xl:items-end"
                >
                  <Field label="Nome">
                    <TextInput name="name" defaultValue={player.name} required />
                  </Field>
                  <Field label="WhatsApp">
                    <TextInput
                      name="whatsapp"
                      defaultValue={player.whatsappFormatted}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      required
                    />
                  </Field>
                  <Field label="Bolão">
                    <TextInput
                      value={player.poolName ?? "Ainda sem bolão"}
                      readOnly
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button
                      disabled={isBusy}
                      className="h-10 rounded-md bg-field px-3 text-sm font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => resetPlayerPin(player.id)}
                      className="h-10 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-canary disabled:text-coal/35"
                    >
                      Resetar senha
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => deletePlayer(player.id)}
                      className="h-10 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:text-red-300"
                    >
                      Excluir
                    </button>
                  </div>
                </form>

                <div className="mt-3 rounded-md border border-field/15 bg-field/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      Conta corrente
                    </p>
                    <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-coal/65">
                      {player.whatsappFormatted}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    {financeEntriesForPlayer(player.id).length === 0 ? (
                      <p className="rounded-md bg-white px-3 py-2 text-coal/70">
                        Nenhum palpite financeiro registrado.
                      </p>
                    ) : null}
                    {financeEntriesForPlayer(player.id).map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-wrap justify-between gap-2 rounded-md bg-white px-3 py-2"
                      >
                        <span className="font-semibold text-ink">
                          {entry.gameLabel} · {entry.predictionLabel}
                        </span>
                        <span className={entry.isPaid ? "text-field" : "text-red-700"}>
                          {entry.amountFormatted} ·{" "}
                          {entry.isPaid ? "Pago" : "Aguardando pagamento"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        ) : null}

        {activeSection === "finance" ? (
        <section id="admin-financeiro" className="rounded-lg border border-line bg-white p-5 shadow-panel lg:col-span-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-ink">Financeiro por aposta</h2>
            <p className="text-sm text-coal/70">
              Valor individual separado por apostador, WhatsApp e jogo apostado.
            </p>
          </div>

          <div className="mt-5 grid gap-3 rounded-md border border-line bg-mist/60 p-3 md:grid-cols-[1fr_0.9fr_0.65fr_auto] md:items-end">
            <Field label="Buscar">
              <TextInput
                value={financeSearch}
                onChange={(event) => setFinanceSearch(event.target.value)}
                placeholder="Nome, WhatsApp, jogo ou palpite"
              />
            </Field>
            <Field label="Jogo">
              <SelectInput
                value={financeGameId}
                onChange={(event) => setFinanceGameId(event.target.value)}
              >
                <option value="">Todos os jogos</option>
                {data.adminGames.map((game) => (
                  <option key={game.id} value={game.id}>
                    Brasil x {game.opponent}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Pagamento">
              <SelectInput
                value={financePaymentFilter}
                onChange={(event) =>
                  setFinancePaymentFilter(event.target.value as PaymentFilter)
                }
              >
                <option value="TODOS">Todos</option>
                <option value="PAGO">Pagos</option>
                <option value="PENDENTE">Pendentes</option>
              </SelectInput>
            </Field>
            <button
              type="button"
              onClick={() => {
                setFinanceSearch("");
                setFinanceGameId("");
                setFinancePaymentFilter("TODOS");
              }}
              className="h-10 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-field hover:text-field"
            >
              Limpar
            </button>
          </div>

          <p className="mt-3 text-xs font-semibold text-coal/60">
            Exibindo {filteredFinanceEntries.length} de{" "}
            {data.adminFinanceEntries.length} lançamento(s).
          </p>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="bg-mist text-xs uppercase text-coal/65">
                  <th className="rounded-l-md border-y border-l border-line px-3 py-3 font-semibold">
                    Apostador
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    WhatsApp
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    Jogo
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    Palpite
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    Valor
                  </th>
                  <th className="rounded-r-md border-y border-r border-line px-3 py-3 font-semibold">
                    Baixa
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFinanceEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-coal/60">
                      Nenhuma aposta financeira encontrada para os filtros.
                    </td>
                  </tr>
                ) : null}
                {filteredFinanceEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="border-b border-line px-3 py-3 font-semibold text-ink">
                      {entry.playerName}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-coal/75">
                      {entry.playerWhatsapp}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-coal/75">
                      {entry.gameLabel}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-coal/75">
                      {entry.predictionLabel}
                    </td>
                    <td className="border-b border-line px-3 py-3 font-semibold text-field">
                      {entry.amountFormatted}
                    </td>
                    <td className="border-b border-line px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                            entry.isPaid
                              ? "bg-field/10 text-field"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {entry.isPaid
                            ? `Pago${entry.paidAt ? ` em ${formatDateTime(entry.paidAt)}` : ""}`
                            : "Aguardando confirmação de pagamento"}
                        </span>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setPredictionPaid(entry.id, !entry.isPaid)}
                          className="h-8 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-field hover:text-field disabled:text-coal/35"
                        >
                          {entry.isPaid ? "Marcar pendente" : "Dar baixa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs font-semibold text-coal/60">
            Palpite com * está aguardando confirmação de pagamento e não entra
            no prêmio até a baixa.
          </p>
        </section>
        ) : null}

        {activeSection === "predictions" ? (
        <section id="admin-palpites" className="rounded-lg border border-line bg-white p-5 shadow-panel lg:col-span-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-ink">Todos os palpites</h2>
            <p className="text-sm text-coal/70">
              Visão administrativa sem mascaramento nem ocultação.
            </p>
          </div>

          <div className="mt-5 grid gap-3 rounded-md border border-line bg-mist/60 p-3 md:grid-cols-[1fr_0.9fr_0.65fr_auto] md:items-end">
            <Field label="Buscar">
              <TextInput
                value={predictionSearch}
                onChange={(event) => setPredictionSearch(event.target.value)}
                placeholder="Nome, WhatsApp, jogo ou palpite"
              />
            </Field>
            <Field label="Jogo">
              <SelectInput
                value={predictionGameId}
                onChange={(event) => setPredictionGameId(event.target.value)}
              >
                <option value="">Todos os jogos</option>
                {data.adminGames.map((game) => (
                  <option key={game.id} value={game.id}>
                    Brasil x {game.opponent}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Pagamento">
              <SelectInput
                value={predictionPaymentFilter}
                onChange={(event) =>
                  setPredictionPaymentFilter(event.target.value as PaymentFilter)
                }
              >
                <option value="TODOS">Todos</option>
                <option value="PAGO">Pagos</option>
                <option value="PENDENTE">Pendentes</option>
              </SelectInput>
            </Field>
            <button
              type="button"
              onClick={() => {
                setPredictionSearch("");
                setPredictionGameId("");
                setPredictionPaymentFilter("TODOS");
              }}
              className="h-10 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-field hover:text-field"
            >
              Limpar
            </button>
          </div>

          <p className="mt-3 text-xs font-semibold text-coal/60">
            Exibindo {filteredAdminPredictions.length} de{" "}
            {data.adminPredictions.length} palpite(s).
          </p>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="bg-mist text-xs uppercase text-coal/65">
                  <th className="rounded-l-md border-y border-l border-line px-3 py-3 font-semibold">
                    Jogador
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    WhatsApp
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    Jogo
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    Palpite
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    Pagamento
                  </th>
                  <th className="rounded-r-md border-y border-r border-line px-3 py-3 font-semibold">
                    Atualizado
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAdminPredictions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-coal/60">
                      Nenhum palpite encontrado para os filtros.
                    </td>
                  </tr>
                ) : null}
                {filteredAdminPredictions.map((prediction) => (
                  <tr key={prediction.id}>
                    <td className="border-b border-line px-3 py-3 font-semibold text-ink">
                      {prediction.playerName}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-coal/75">
                      {prediction.playerWhatsapp}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-coal/75">
                      {prediction.gameLabel}
                    </td>
                    <td className="border-b border-line px-3 py-3">
                      <span className="rounded-md bg-field/10 px-2.5 py-1 text-xs font-semibold text-field">
                        {prediction.predictionLabel}
                      </span>
                    </td>
                    <td className="border-b border-line px-3 py-3">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                          prediction.isPaid
                            ? "bg-field/10 text-field"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {prediction.isPaid ? "Pago" : "Aguardando pagamento"}
                      </span>
                    </td>
                    <td className="border-b border-line px-3 py-3 text-coal/65">
                      {formatDateTime(prediction.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs font-semibold text-coal/60">
            O asterisco (*) identifica palpite aguardando confirmação de
            pagamento.
          </p>
        </section>
        ) : null}

        {activeSection === "audit" ? (
        <section id="admin-auditoria" className="rounded-lg border border-line bg-white p-5 shadow-panel lg:col-span-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-ink">Trilha de auditoria dos palpites</h2>
            <p className="text-sm text-coal/70">
              Registro de criação, edição e exclusão de palpites.
            </p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="bg-mist text-xs uppercase text-coal/65">
                  <th className="rounded-l-md border-y border-l border-line px-3 py-3 font-semibold">
                    Horário
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    Ação
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    Jogador
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    WhatsApp
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    Jogo
                  </th>
                  <th className="border-y border-line px-3 py-3 font-semibold">
                    Antes
                  </th>
                  <th className="rounded-r-md border-y border-r border-line px-3 py-3 font-semibold">
                    Depois
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.predictionAudits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-coal/60">
                      Nenhum evento de auditoria registrado ainda.
                    </td>
                  </tr>
                ) : null}
                {data.predictionAudits.map((audit) => (
                  <tr key={audit.id}>
                    <td className="border-b border-line px-3 py-3 text-coal/65">
                      {formatDateTime(audit.createdAt)}
                    </td>
                    <td className="border-b border-line px-3 py-3">
                      <span className="rounded-md bg-ink px-2.5 py-1 text-xs font-semibold text-white">
                        {auditActionLabel(audit.action)}
                      </span>
                    </td>
                    <td className="border-b border-line px-3 py-3 font-semibold text-ink">
                      {audit.playerName}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-coal/75">
                      {audit.playerWhatsapp}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-coal/75">
                      {audit.gameLabel}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-coal/75">
                      {audit.previousLabel ?? "-"}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-coal/75">
                      {audit.nextLabel ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        ) : null}
      </div>

      {activeModal ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 px-4 py-5 backdrop-blur-sm sm:items-center"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-line bg-white p-5 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  {activeModal === "pool" ? "Cadastrar bolão" : "Cadastrar jogo"}
                </h2>
                <p className="mt-1 text-sm text-coal/70">
                  {activeModal === "pool"
                    ? "Defina o grupo e o PIX que aparece para os palpiteiros."
                    : "Cadastre o jogo dentro de um bolão e informe o valor por palpite."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetNewGameFormState();
                  setActiveModal(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-lg font-semibold text-coal transition hover:border-field hover:text-field"
                aria-label="Fechar cadastro"
              >
                ×
              </button>
            </div>

            {activeModal === "pool" ? (
              <form onSubmit={handleCreatePool} className="mt-5 grid gap-3">
                <Field label="Nome do bolão">
                  <TextInput
                    name="name"
                    placeholder="Bet Barão by d. Rosa"
                    required
                  />
                </Field>
                <Field label="PIX para depósito">
                  <TextInput
                    name="pixKey"
                    placeholder="91 98258-5313"
                    defaultValue="91 98258-5313"
                    required
                  />
                </Field>
                <Field label="Titular do PIX">
                  <TextInput
                    name="pixOwner"
                    placeholder="Rosely Silva"
                    defaultValue="Rosely Silva"
                    required
                  />
                </Field>
                <button
                  disabled={isBusy}
                  className="h-11 rounded-md bg-field px-4 text-sm font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
                >
                  Salvar bolão
                </button>
              </form>
            ) : null}

            {activeModal === "game" ? (
              <form onSubmit={handleCreateGame} className="mt-5 grid gap-3 md:grid-cols-2">
                <Field label="Bolão">
                  <SelectInput name="poolId" required>
                    {data.adminPools.length === 0 ? (
                      <option value="">Cadastre um bolão primeiro</option>
                    ) : null}
                    {data.adminPools.map((pool) => (
                      <option key={pool.id} value={pool.id}>
                        {pool.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <OpponentField
                  value={newGameOpponent}
                  onValueChange={setNewGameOpponent}
                />
                <Field label="Fase">
                  <TextInput
                    name="phase"
                    value={newGamePhase}
                    onChange={(event) => setNewGamePhase(event.target.value)}
                    placeholder="Fase de grupos"
                    required
                  />
                </Field>
                <Field label="Data/hora">
                  <TextInput
                    name="kickoffAt"
                    type="datetime-local"
                    value={newGameKickoffAt}
                    onChange={(event) => setNewGameKickoffAt(event.target.value)}
                    required
                  />
                </Field>
                <Field label="Valor do bolão">
                  <TextInput
                    name="valorBolao"
                    defaultValue="20,00"
                    inputMode="decimal"
                  />
                </Field>
                <div className="rounded-lg border border-field/15 bg-field/5 p-3 md:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        Dados API-Football
                      </p>
                      <p className="mt-1 text-xs font-semibold text-coal/60">
                        Usa a API Key já salva na aba API-Football. O Fixture ID
                        é o número que fica gravado no jogo para atualizar o
                        placar automaticamente.
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        data.apiFootballKeyConfigured
                          ? "border-field/20 bg-white text-field"
                          : "border-canary/40 bg-canary/15 text-ink"
                      }`}
                    >
                      {data.apiFootballKeyConfigured
                        ? "API Key salva"
                        : "API Key pendente"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Field label="Fixture ID API-Football">
                      <TextInput
                        name="apiFootballFixtureId"
                        value={newGameFixtureId}
                        onChange={(event) =>
                          setNewGameFixtureId(event.target.value)
                        }
                        inputMode="numeric"
                        placeholder="Ex.: 1234567"
                      />
                    </Field>
                    <Field label="Link de referência/API do jogo">
                      <TextInput
                        name="scoreSourceUrl"
                        inputMode="url"
                        placeholder="https://v3.football.api-sports.io/fixtures?id=..."
                      />
                    </Field>
                    <Field label="League ID / campeonato">
                      <TextInput
                        name="apiFootballLeagueId"
                        inputMode="numeric"
                        placeholder="Use a busca da aba API-Football"
                      />
                    </Field>
                    <Field label="Temporada">
                      <TextInput
                        name="apiFootballSeason"
                        inputMode="numeric"
                        placeholder="2026"
                      />
                    </Field>
                    <Field label="Team ID Brasil">
                      <TextInput
                        name="apiFootballBrazilTeamId"
                        inputMode="numeric"
                        placeholder="ID numérico da seleção"
                      />
                    </Field>
                    <Field label="Team ID adversário">
                      <TextInput
                        name="apiFootballOpponentTeamId"
                        inputMode="numeric"
                        placeholder="ID numérico do adversário"
                      />
                    </Field>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={(event) =>
                        searchFixturesForGameModal(event.currentTarget.form)
                      }
                      className="h-9 rounded-md bg-field px-3 text-xs font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
                    >
                      Buscar fixture e preencher
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetNewGameFormState();
                        setActiveModal(null);
                        setActiveSection("api");
                      }}
                      className="h-9 rounded-md border border-field/20 bg-white px-3 text-xs font-semibold text-field transition hover:bg-field/10"
                    >
                      Abrir buscador API-Football
                    </button>
                  </div>
                  {gameModalFixtureStatus ? (
                    <p className="mt-3 rounded-md border border-canary/30 bg-canary/15 px-3 py-2 text-xs font-semibold text-ink">
                      {gameModalFixtureStatus}
                    </p>
                  ) : null}
                  {gameModalFixtureCandidates.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {gameModalFixtureCandidates.map((fixture) => (
                        <button
                          key={fixture.fixtureId}
                          type="button"
                          onClick={() => applyFixtureToGameModal(fixture)}
                          className="rounded-md border border-line bg-white px-3 py-2 text-left text-xs font-semibold text-ink transition hover:border-field hover:bg-field/5"
                        >
                          <span className="block text-sm">
                            Brasil x {fixture.opponent}
                          </span>
                          <span className="mt-1 block text-coal/65">
                            Fixture {fixture.fixtureId} · {fixture.round} ·{" "}
                            {formatDateTime(fixture.kickoffAt)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Field label="Regra para os palpiteiros">
                  <TextInput
                    name="predictionRule"
                    defaultValue={DEFAULT_PREDICTION_RULE}
                    required
                  />
                </Field>
                <Field label="Status">
                  <SelectInput name="status" defaultValue="ABERTO">
                    <option value="ABERTO">Aberto</option>
                    <option value="ENCERRADO">Finalizado</option>
                  </SelectInput>
                </Field>
                <div className="md:col-span-2">
                  <ScoreFields />
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-coal md:col-span-2">
                  <input
                    name="hidePredictionsUntilLocked"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 accent-field"
                  />
                  Ocultar palpites dos outros até 10 minutos antes do jogo
                </label>
                <button
                  disabled={isBusy || data.adminPools.length === 0}
                  className="h-11 rounded-md bg-field px-4 text-sm font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30 md:col-span-2"
                >
                  Salvar jogo
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
