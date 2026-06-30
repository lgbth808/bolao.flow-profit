"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { PublicGame, PublicPoolData } from "@/lib/types";
import { formatBrasiliaDateTime } from "@/lib/datetime";
import { formatBRL } from "@/lib/money";
import { formatBrazilianWhatsapp } from "@/lib/phone";
import { BRAZIL_FLAG } from "@/lib/flags";

type IdentifiedPlayer = {
  id: string;
  name: string;
  whatsapp: string;
  whatsappFormatted: string;
  poolId: string | null;
  poolName: string | null;
};

type ApiResult<T> = T & {
  error?: string;
};

type PinAction =
  | { type: "joinPool" }
  | { type: "savePrediction" }
  | { type: "deletePrediction"; predictionId: string };

const PLAYER_STORAGE_KEY = "bolao-d-rosa-do-brassssillll-player";
const SELECTED_POOL_STORAGE_KEY = "bolao-d-rosa-do-brassssillll-pool";
const PIX_NUMBER = "91 98258-5313";
const PIX_OWNER = "Rosely Silva";

function formatDateTime(value: string) {
  return formatBrasiliaDateTime(value);
}

function statusClass(game: PublicGame) {
  if (game.status !== "ABERTO" || game.finishedAt) {
    return "border-field/20 bg-field/10 text-field";
  }

  return "border-field/25 bg-white text-field";
}

function gameDisplayStatus(game: PublicGame) {
  return game.status === "ABERTO" && !game.finishedAt ? "Aberto" : "Finalizado";
}

function countdownToLock(lockAt: string, now: Date) {
  const diff = new Date(lockAt).getTime() - now.getTime();

  if (diff <= 0) {
    return "Apostas fechadas";
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}min ${seconds}s`;
}

function clampGoal(value: number) {
  return Math.max(0, Math.min(30, value));
}

function changeGoal(
  currentValue: string,
  setter: (nextValue: string) => void,
  delta: number
) {
  const currentNumber = Number(currentValue);
  const nextValue = clampGoal(Number.isFinite(currentNumber) ? currentNumber + delta : 0);

  setter(String(nextValue));
}

function predictionResultClass(label: string) {
  if (label === "Premiado" || label === "Acertando agora") {
    return "bg-field/10 text-field";
  }

  if (label === "Aguardando pagamento") {
    return "bg-red-50 text-red-700";
  }

  if (label === "Não premiado") {
    return "bg-red-50 text-red-700";
  }

  return "bg-canary/20 text-ink";
}

function prizeShareText(game: PublicGame) {
  if (!game.currentWinningScoreLabel) {
    return "O rateio aparece aqui quando o jogo começar.";
  }

  if (game.currentWinningQuotaCount === 0) {
    return game.currentPrizeStatus === "FINAL"
      ? "Prêmio cravado: sem vencedor neste jogo."
      : "Nenhuma cota está acertando o placar atual.";
  }

  const prefix =
    game.currentPrizeStatus === "FINAL" ? "Prêmio cravado" : "Acertando agora";

  return `${prefix}: ${game.currentWinningQuotaCount} cota(s) em ${game.currentWinningScoreLabel} · ${game.currentWinningShareAmountFormatted} por cota.`;
}

function prizeShareClass(game: PublicGame) {
  if (!game.currentWinningScoreLabel) {
    return "border-line bg-mist/70 text-coal/70";
  }

  if (game.currentWinningQuotaCount === 0) {
    return "border-canary/30 bg-canary/15 text-ink";
  }

  return "border-field/25 bg-field/10 text-field";
}

function displayScore(game: PublicGame) {
  const match = game.scoreLabel.match(/(\d+)\s*x\s*(\d+)/i);

  return {
    brazil: game.brazilScore ?? (match ? Number(match[1]) : 0),
    opponent: game.opponentScore ?? (match ? Number(match[2]) : 0)
  };
}

function CompactGameScore({ game }: { game: PublicGame }) {
  const isWinningScore = game.currentWinningQuotaCount > 0;
  const score = displayScore(game);
  const scoreBoxClass = `flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg border px-3 text-lg font-bold shadow-sm ${
    isWinningScore
      ? "border-field/25 bg-field text-white"
      : "border-line bg-white text-ink"
  }`;

  return (
    <div className="w-full max-w-md rounded-lg border border-white/70 bg-white/80 px-3 py-2 shadow-sm md:min-w-[360px]">
      <p className="mb-1 text-center text-[11px] font-semibold uppercase text-coal/55">
        Placar do jogo
      </p>
      <div className="grid grid-cols-[minmax(70px,1fr)_44px_16px_44px_minmax(70px,1fr)] items-center gap-2">
        <div className="min-w-0 text-right">
          <p className="truncate text-xs font-semibold text-ink">
            {BRAZIL_FLAG} Brasil
          </p>
        </div>
        <span className={scoreBoxClass}>{score.brazil}</span>
        <span className="text-center text-sm font-bold text-coal/50">x</span>
        <span className={scoreBoxClass}>{score.opponent}</span>
        <div className="min-w-0 text-left">
          <p className="truncate text-xs font-semibold text-ink">
            {game.opponentFlag} {game.opponent}
          </p>
        </div>
      </div>
      {isWinningScore ? (
        <p className="mt-1 text-center text-[11px] font-semibold text-field">
          {game.currentWinningQuotaCount} cota(s) acertando ·{" "}
          {game.currentWinningShareAmountFormatted}
        </p>
      ) : null}
      <p className="mt-1 text-center text-[11px] font-semibold text-coal/55">
        {game.apiFootballElapsed
          ? `${game.apiFootballElapsed}'`
          : game.apiFootballStatusLong ?? game.statusLabel}
      </p>
    </div>
  );
}

async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResult<T>;

  if (!response.ok) {
    throw new Error(payload.error ?? "Erro inesperado.");
  }

  return payload as T;
}

function ScorePicker({
  label,
  teamName,
  flag,
  value,
  disabled,
  onChange,
  onStep
}: {
  label: string;
  teamName: string;
  flag: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onStep: (delta: number) => void;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-mist text-3xl"
        >
          {flag}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-coal/60">{label}</p>
          <p className="truncate text-base font-semibold text-ink">{teamName}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[42px_1fr_42px] items-center gap-2">
        <button
          type="button"
          aria-label={`Diminuir gols de ${teamName}`}
          disabled={disabled || Number(value) <= 0}
          onClick={() => onStep(-1)}
          className="h-11 rounded-md border border-line bg-mist text-xl font-semibold text-ink transition hover:border-field hover:bg-field/10 disabled:bg-coal/10 disabled:text-coal/30"
        >
          -
        </button>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          min={0}
          max={30}
          type="number"
          disabled={disabled}
          className="number-input h-14 rounded-md border border-line bg-white px-3 text-center text-3xl font-semibold text-ink outline-none transition focus:border-field focus:ring-2 focus:ring-field/15 disabled:bg-coal/5 disabled:text-coal/40"
        />
        <button
          type="button"
          aria-label={`Aumentar gols de ${teamName}`}
          disabled={disabled || Number(value) >= 30}
          onClick={() => onStep(1)}
          className="h-11 rounded-md border border-line bg-canary/20 text-xl font-semibold text-ink transition hover:border-canary hover:bg-canary/35 disabled:bg-coal/10 disabled:text-coal/30"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function PublicPool({ initialData }: { initialData: PublicPoolData }) {
  const [data, setData] = useState(initialData);
  const [player, setPlayer] = useState<IdentifiedPlayer | null>(null);
  const [selectedPoolId, setSelectedPoolId] = useState(
    initialData.selectedPoolId ?? initialData.pools[0]?.id ?? ""
  );
  const [selectedGameId, setSelectedGameId] = useState("");
  const [pinModalAction, setPinModalAction] = useState<PinAction | null>(null);
  const [pin, setPin] = useState("");
  const [brazilGoals, setBrazilGoals] = useState("0");
  const [opponentGoals, setOpponentGoals] = useState("0");
  const [editingPredictionId, setEditingPredictionId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [hasLoadedSavedPlayer, setHasLoadedSavedPlayer] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isPixOpen, setIsPixOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [now, setNow] = useState(() => new Date());

  const selectedGame = useMemo(
    () => data.games.find((game) => game.id === selectedGameId),
    [data.games, selectedGameId]
  );
  const selectedPool = useMemo(
    () =>
      data.pools.find((pool) => pool.id === selectedPoolId) ??
      data.pools.find((pool) => pool.id === data.selectedPoolId) ??
      data.pools[0],
    [data.pools, data.selectedPoolId, selectedPoolId]
  );

  const ownPredictionsForGame = useMemo(
    () =>
      data.currentPlayerPredictions.filter(
        (prediction) => prediction.gameId === selectedGame?.id
      ),
    [data.currentPlayerPredictions, selectedGame?.id]
  );

  const editingPrediction = useMemo(
    () =>
      ownPredictionsForGame.find(
        (prediction) => prediction.id === editingPredictionId
      ),
    [editingPredictionId, ownPredictionsForGame]
  );

  const isPinReady = /^\d{4}$/.test(pin);

  function switchPlayer() {
    window.localStorage.removeItem(PLAYER_STORAGE_KEY);
    window.localStorage.removeItem(SELECTED_POOL_STORAGE_KEY);
  }

  function openPinModal(action: PinAction) {
    setPin("");
    setError("");
    setPinModalAction(action);
  }

  function closePinModal() {
    setPin("");
    setPinModalAction(null);
  }

  async function refresh(nextPlayerId = player?.id, nextPoolId = selectedPoolId) {
    const params = new URLSearchParams();

    if (nextPlayerId) {
      params.set("playerId", nextPlayerId);
    }

    if (nextPoolId) {
      params.set("poolId", nextPoolId);
    }

    const response = await fetch(
      `/api/public${params.size ? `?${params.toString()}` : ""}`,
      { cache: "no-store" }
    );
    const freshData = await readApi<PublicPoolData>(response);
    const nextSelectedPoolId =
      freshData.currentPlayerPoolId ?? freshData.selectedPoolId ?? nextPoolId ?? "";

    setData(freshData);
    setSelectedPoolId(nextSelectedPoolId);

    if (nextPlayerId && !freshData.currentPlayerFound) {
      setPlayer(null);
      window.localStorage.removeItem(PLAYER_STORAGE_KEY);
      window.localStorage.removeItem(SELECTED_POOL_STORAGE_KEY);
      return;
    }

    if (nextPlayerId && freshData.currentPlayerPoolId) {
      setPlayer((current) => {
        if (!current || current.id !== nextPlayerId) {
          return current;
        }

        const updated = {
          ...current,
          poolId: freshData.currentPlayerPoolId,
          poolName: freshData.currentPlayerPoolName
        };

        window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(updated));

        return updated;
      });
      window.localStorage.setItem(SELECTED_POOL_STORAGE_KEY, freshData.currentPlayerPoolId);
    }

    if (selectedGameId && !freshData.games.some((game) => game.id === selectedGameId)) {
      setSelectedGameId("");
    }
  }

  function handlePoolChange(nextPoolId: string) {
    if (player?.poolId && player.poolId !== nextPoolId) {
      setError(
        "Este WhatsApp já participa de um bolão. Cada WhatsApp pode participar de apenas 1 bolão."
      );
      return;
    }

    setSelectedPoolId(nextPoolId);
    window.localStorage.setItem(SELECTED_POOL_STORAGE_KEY, nextPoolId);
    setSelectedGameId("");
    refresh(player?.id, nextPoolId).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Erro ao trocar bolão.");
    });
  }

  useEffect(() => {
    const saved = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    const savedPoolId = window.localStorage.getItem(SELECTED_POOL_STORAGE_KEY);

    if (savedPoolId) {
      setSelectedPoolId(savedPoolId);
    }

    if (!saved) {
      setHasLoadedSavedPlayer(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as IdentifiedPlayer;
      setPlayer(parsed);
      refresh(parsed.id, savedPoolId ?? selectedPoolId).catch(() => undefined);
    } catch {
      window.localStorage.removeItem(PLAYER_STORAGE_KEY);
    } finally {
      setHasLoadedSavedPlayer(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 60_000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id, selectedPoolId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (editingPrediction) {
      setBrazilGoals(String(editingPrediction.brazilGoals));
      setOpponentGoals(String(editingPrediction.opponentGoals));
      return;
    }

    setBrazilGoals("0");
    setOpponentGoals("0");
  }, [editingPrediction, selectedGameId]);

  function handlePrediction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!player || !selectedGame) {
      setError("Identifique o jogador e selecione um jogo.");
      return;
    }

    if (!player.poolId) {
      setError("Escolha o bolão que você quer participar antes de salvar palpites.");
      return;
    }

    openPinModal({ type: "savePrediction" });
  }

  async function savePredictionWithPin(pinValue: string) {
    if (!player || !selectedGame) {
      setError("Identifique o jogador e selecione um jogo.");
      return;
    }

    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const isEditing = Boolean(editingPredictionId);
      const response = await fetch(
        isEditing ? `/api/predictions/${editingPredictionId}` : "/api/predictions",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: player.id,
            gameId: selectedGame.id,
            pin: pinValue,
            brazilGoals,
            opponentGoals
          })
        }
      );

      await readApi(response);
      await refresh(player.id);
      setEditingPredictionId("");
      if (isEditing) {
        setFeedbackMessage("Aposta atualizada.");
      } else {
        setFeedbackMessage("");
        setIsPixOpen(true);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao salvar palpite.");
    } finally {
      setIsBusy(false);
    }
  }

  function choosePool() {
    if (!player || !selectedPoolId) {
      setError("Entre com seu jogador e selecione um bolão.");
      return;
    }

    openPinModal({ type: "joinPool" });
  }

  async function choosePoolWithPin(pinValue: string) {
    if (!player || !selectedPoolId) {
      setError("Entre com seu jogador e selecione um bolão.");
      return;
    }

    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/players/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.id,
          poolId: selectedPoolId,
          pin: pinValue
        })
      });
      const result = await readApi<{ player: IdentifiedPlayer }>(response);

      setPlayer(result.player);
      window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(result.player));
      window.localStorage.setItem(SELECTED_POOL_STORAGE_KEY, selectedPoolId);
      await refresh(result.player.id, selectedPoolId);
      setFeedbackMessage(`Você está no bolão ${result.player.poolName ?? "selecionado"}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao escolher bolão.");
    } finally {
      setIsBusy(false);
    }
  }

  function deletePrediction(predictionId: string) {
    if (!window.confirm("Excluir este palpite?")) {
      return;
    }

    if (!player) {
      setError("Identifique o jogador para excluir o palpite.");
      return;
    }

    openPinModal({ type: "deletePrediction", predictionId });
  }

  async function deletePredictionWithPin(predictionId: string, pinValue: string) {
    if (!player) {
      setError("Identifique o jogador para excluir o palpite.");
      return;
    }

    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/predictions/${predictionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.id,
          pin: pinValue
        })
      });

      await readApi(response);
      await refresh(player.id);
      if (editingPredictionId === predictionId) {
        setEditingPredictionId("");
      }
      setFeedbackMessage("Aposta excluída.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao excluir palpite.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pinModalAction || !isPinReady) {
      return;
    }

    const currentAction = pinModalAction;
    const pinValue = pin;
    closePinModal();

    if (currentAction.type === "joinPool") {
      await choosePoolWithPin(pinValue);
      return;
    }

    if (currentAction.type === "savePrediction") {
      await savePredictionWithPin(pinValue);
      return;
    }

    await deletePredictionWithPin(currentAction.predictionId, pinValue);
  }

  async function copyToClipboard(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(successMessage);
    } catch {
      setCopyMessage("Não foi possível copiar automaticamente.");
    }
  }

  const paymentGameLabel = selectedGame
    ? `Brasil x ${selectedGame.opponent}`
    : "Brasil x adversário";
  const selectedPixKey = selectedPool?.pixKey ?? PIX_NUMBER;
  const selectedPixOwner = selectedPool?.pixOwner ?? PIX_OWNER;
  const hasConfirmedPool = Boolean(player?.poolId);

  function predictionResultLabel(prediction: {
    brazilGoals: number;
    opponentGoals: number;
    isPaid: boolean;
    isCurrentlyWinning: boolean;
  }) {
    if (!prediction.isPaid) {
      return "Aguardando pagamento";
    }

    if (prediction.isCurrentlyWinning) {
      return selectedGame?.currentPrizeStatus === "FINAL"
        ? "Premiado"
        : "Acertando agora";
    }

    if (
      !selectedGame ||
      selectedGame.currentPrizeStatus === "WAITING" ||
      selectedGame.currentPrizeStatus !== "FINAL" ||
      !selectedGame.isScoreRevealed ||
      selectedGame.brazilScore === null ||
      selectedGame.opponentScore === null
    ) {
      return "Aguardando resultado";
    }

    return prediction.brazilGoals === selectedGame.brazilScore &&
      prediction.opponentGoals === selectedGame.opponentScore
      ? "Premiado"
      : "Não premiado";
  }

  return (
    <main className="min-h-screen bg-mist/45">
      {hasLoadedSavedPlayer && !player ? (
        <section className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <h2 className="text-xl font-semibold text-ink">Entrar ou cadastrar</h2>
            <p className="mt-2 text-sm text-coal/70">
              A página de apostas é liberada apenas depois do login pelo
              WhatsApp.
            </p>
            <a
              href="/"
              className="mt-5 inline-flex h-11 items-center rounded-md bg-field px-4 text-sm font-semibold text-white transition hover:bg-field/90"
            >
              Ir para login/cadastro
            </a>
          </div>
        </section>
      ) : null}

      {!hasLoadedSavedPlayer || player ? (
      <div className="mx-auto grid max-w-5xl gap-5 px-4 py-6 lg:px-6">
        <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold text-ink">
                Olá{player ? `, ${player.name}` : ""}. Selecione seu bolão.
              </h2>
              <p className="text-sm text-coal/70">
                Quando selecionar, os jogos cadastrados aparecem para gerenciar
                seus palpites.
              </p>
            </div>
            {player ? (
              <a
                href="/"
                onClick={switchPlayer}
                className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-field hover:text-field"
              >
                Trocar jogador
              </a>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3">
            {player ? (
              <p className="text-sm text-coal/70">
                WhatsApp: {formatBrazilianWhatsapp(player.whatsapp)}
              </p>
            ) : null}
            <div className="rounded-lg border border-field/20 bg-gradient-to-r from-field/10 via-white to-canary/20 p-3 shadow-sm sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-coal/55">
                    Bolão selecionado
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-ink">
                    {selectedPool?.name ?? "Escolha um bolão"}
                  </p>
                </div>
                {player?.poolId ? (
                  <span className="rounded-full border border-field/20 bg-white px-3 py-1 text-xs font-semibold text-field">
                    Participando
                  </span>
                ) : null}
              </div>
              <label className="mt-3 grid gap-1 text-sm font-semibold text-coal">
                <span>Escolher bolão</span>
                <div className="relative">
                  <select
                    value={selectedPoolId}
                    onChange={(event) => handlePoolChange(event.target.value)}
                    disabled={Boolean(player?.poolId)}
                    className="h-12 w-full appearance-none rounded-md border border-field/20 bg-white/95 px-3 pr-10 text-sm font-semibold text-ink shadow-sm outline-none transition focus:border-field focus:ring-2 focus:ring-field/15 disabled:bg-mist disabled:text-coal/70"
                  >
                    {data.pools.length === 0 ? (
                      <option value="">Nenhum bolão cadastrado</option>
                    ) : null}
                    {data.pools.map((pool) => (
                      <option key={pool.id} value={pool.id}>
                        {pool.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-field">
                    ˅
                  </span>
                </div>
              </label>
              <p className="mt-2 text-xs font-semibold text-coal/60">
                PIX do bolão: {selectedPool?.pixKey ?? PIX_NUMBER}
                {selectedPool?.pixOwner ? ` · ${selectedPool.pixOwner}` : ""}
              </p>
            </div>

            {hasLoadedSavedPlayer && !player ? (
              <div className="rounded-md border border-canary/30 bg-canary/15 px-3 py-2 text-sm font-semibold text-ink">
                Para apostar, entre ou cadastre-se primeiro na tela inicial.{" "}
                <a href="/" className="underline">
                  Ir para login/cadastro
                </a>
              </div>
            ) : null}

            {player && !player.poolId ? (
              <div className="rounded-md border border-canary/30 bg-canary/15 px-3 py-3">
                <p className="text-sm font-semibold text-ink">
                  Escolha o bolão que deseja participar. Depois de confirmar,
                  este WhatsApp ficará vinculado a apenas esse bolão.
                </p>
                <button
                  type="button"
                  disabled={isBusy || !selectedPoolId}
                  onClick={choosePool}
                  className="mt-3 h-10 rounded-md bg-field px-4 text-sm font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
                >
                  Participar deste bolão
                </button>
              </div>
            ) : null}

          </div>

          {hasConfirmedPool ? (
            <>
              <div className="mt-4">
                <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold uppercase text-red-700 shadow-sm">
                  Quanto mais palpites, mais chances de ganhar; você pode fazer quantos quiser
                </span>
              </div>

              <form onSubmit={handlePrediction} className="mt-5 grid gap-4">
                {data.games.length === 0 ? (
                  <p className="rounded-md border border-line bg-mist px-3 py-3 text-sm text-coal/70">
                    Nenhum jogo cadastrado neste bolão.
                  </p>
                ) : null}
                {data.games.map((game) => {
                  const isSelected = selectedGameId === game.id;
                  const ownPredictions = data.currentPlayerPredictions.filter(
                    (prediction) => prediction.gameId === game.id
                  );
                  const gamePlayers = data.players.filter((item) => {
                    const prediction = item.predictions.find(
                      (entry) => entry.gameId === game.id
                    );

                    return Boolean(prediction && prediction.predictionCount > 0);
                  });
                  const lockCountdown = countdownToLock(game.lockAt, now);

                  return (
                    <details
                      key={game.id}
                      open={isSelected}
                      className={`rounded-lg bg-gradient-to-r from-field/10 via-canary/15 to-white p-4 transition ${
                        isSelected
                          ? "border-2 border-field shadow-panel"
                          : "border border-field/20"
                      }`}
                    >
                      <summary
                        onClick={(event) => {
                          event.preventDefault();
                          setSelectedGameId(isSelected ? "" : game.id);
                          setEditingPredictionId("");
                        }}
                        className="cursor-pointer list-none"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-[240px] flex-1 items-center gap-3">
                            <div className="flex -space-x-2">
                              <span
                                aria-hidden="true"
                                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white text-3xl shadow-sm"
                              >
                                {BRAZIL_FLAG}
                              </span>
                              <span
                                aria-hidden="true"
                                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white text-3xl shadow-sm"
                              >
                                {game.opponentFlag}
                              </span>
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-ink">
                                Brasil x {game.opponent}
                              </p>
                              <p className="mt-1 text-sm text-coal/70">
                                {game.phase} · Início{" "}
                                {formatDateTime(game.kickoffAt)}
                              </p>
                            </div>
                          </div>
                          <CompactGameScore game={game} />
                          <div className="flex flex-col items-start gap-1 sm:items-end">
                            <span
                              className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${statusClass(
                                game
                              )}`}
                            >
                              {gameDisplayStatus(game)}
                            </span>
                            <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink shadow-sm">
                              {lockCountdown === "Apostas fechadas"
                                ? lockCountdown
                                : `Fecha em ${lockCountdown}`}
                            </span>
                          </div>
                        </div>
                      </summary>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <p className="rounded-md bg-white/75 px-3 py-2 text-xs font-semibold text-coal/70">
                          Valor por palpite: {game.valorBolaoFormatted}
                        </p>
                        <p className="rounded-md bg-white/75 px-3 py-2 text-xs font-semibold text-coal/70">
                          Prêmio atual: {game.prizeAmountFormatted}
                        </p>
                        <p className="rounded-md bg-white/75 px-3 py-2 text-xs font-semibold text-coal/70">
                          Palpites carregados: {game.predictionCount}
                        </p>
                        <p className="rounded-md bg-white/75 px-3 py-2 text-xs font-semibold text-coal/70">
                          Palpites fecham em {formatDateTime(game.lockAt)}
                        </p>
                      </div>
                      <p className="mt-2 rounded-md border border-field/20 bg-white px-3 py-2 text-sm font-semibold text-ink">
                        Regra: {game.predictionRule}
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                        <p
                          className={`rounded-md border px-3 py-2 text-sm font-semibold ${prizeShareClass(
                            game
                          )}`}
                        >
                          {prizeShareText(game)}
                        </p>
                        <p className="rounded-md bg-white/80 px-3 py-2 text-xs font-semibold text-coal/60">
                          Última atualização:{" "}
                          {game.scoreLastSyncedAt
                            ? formatDateTime(game.scoreLastSyncedAt)
                            : "ainda não atualizou pela API"}
                        </p>
                      </div>
                      <div className="mt-3 rounded-md border border-white bg-white/85 px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">
                            Meus palpites
                          </p>
                          <button
                            type="button"
                            disabled={isBusy || game.isLocked}
                            onClick={() => {
                              setSelectedGameId(game.id);
                              setEditingPredictionId("");
                            }}
                            className="h-8 rounded-md bg-field px-3 text-xs font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
                          >
                            Novo palpite
                          </button>
                        </div>
                        <div className="mt-3 grid gap-2">
                          {ownPredictions.length === 0 ? (
                            <p className="rounded-md bg-mist px-3 py-2 text-sm text-coal/70">
                              Você ainda não carregou palpite para este jogo.
                            </p>
                          ) : null}
                          {ownPredictions.map((prediction, index) => {
                            const resultLabel = predictionResultLabel(prediction);

                            return (
                              <div
                                key={prediction.id}
                                className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                                  prediction.isCurrentlyWinning
                                    ? "border-field bg-field/5"
                                    : editingPredictionId === prediction.id
                                    ? "border-field bg-field/5"
                                    : "border-line bg-mist/60"
                                }`}
                              >
                                <span className="font-semibold text-ink">
                                  Palpite {index + 1}: {prediction.label}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  <span
                                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${predictionResultClass(
                                      resultLabel
                                    )}`}
                                  >
                                    {resultLabel}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={isBusy || game.isLocked}
                                    onClick={() => {
                                      setSelectedGameId(game.id);
                                      setEditingPredictionId(prediction.id);
                                    }}
                                    className="h-8 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-field hover:text-field disabled:text-coal/35"
                                  >
                                    Editar aposta
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy || game.isLocked}
                                    onClick={() => deletePrediction(prediction.id)}
                                    className="h-8 rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:text-red-300"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-3 rounded-md border border-white bg-white/85 px-3 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">
                              Palpites, prêmio e pagamentos
                            </p>
                            <p className="mt-1 text-xs font-semibold text-coal/60">
                              Só aparecem jogadores que fizeram palpite neste
                              jogo. Palpites dos outros ficam embaçados até as
                              apostas fecharem.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            <span className="rounded-md bg-field/10 px-2.5 py-1 text-field">
                              {game.prizeAmountFormatted}
                            </span>
                            <span className="rounded-md bg-mist px-2.5 py-1 text-coal">
                              {game.paidPredictionCount} pagos ·{" "}
                              {game.pendingPaymentCount} pendentes
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 overflow-x-auto">
                          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                            <thead>
                              <tr className="bg-mist text-xs uppercase text-coal/65">
                                <th className="rounded-l-md border-y border-l border-line px-3 py-2 font-semibold">
                                  Jogador
                                </th>
                                <th className="border-y border-line px-3 py-2 font-semibold">
                                  WhatsApp
                                </th>
                                <th className="rounded-r-md border-y border-r border-line px-3 py-2 font-semibold">
                                  Palpite
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {gamePlayers.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="px-3 py-6 text-center text-sm text-coal/60"
                                  >
                                    Nenhum palpite carregado para este jogo.
                                  </td>
                                </tr>
                              ) : null}
                              {gamePlayers.map((item) => {
                                const prediction = item.predictions.find(
                                  (entry) => entry.gameId === game.id
                                );

                                return (
                                  <tr
                                    key={item.id}
                                    className={
                                      prediction?.isCurrentlyWinning
                                        ? "bg-field/5"
                                        : undefined
                                    }
                                  >
                                    <td className="border-b border-line px-3 py-3 font-semibold text-ink">
                                      {item.name}
                                    </td>
                                    <td className="border-b border-line px-3 py-3 text-coal/75">
                                      {item.maskedWhatsapp}
                                    </td>
                                    <td className="border-b border-line px-3 py-3">
                                      <span
                                        className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                                          prediction?.isHidden
                                            ? "select-none bg-canary/20 text-ink blur-[2px]"
                                            : prediction?.isCurrentlyWinning
                                              ? "bg-field/10 text-field"
                                            : prediction?.isOwn
                                              ? "bg-field/10 text-field"
                                            : "bg-mist text-coal"
                                        }`}
                                        title={
                                          prediction?.isHidden
                                            ? "Palpite de outro jogador fica embaçado na página pública"
                                            : prediction?.pendingPaymentCount
                                              ? "Aguardando confirmação de pagamento"
                                              : undefined
                                        }
                                      >
                                        {prediction?.display ?? "-"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <p className="mt-3 text-xs font-semibold text-coal/60">
                          * indica palpite aguardando confirmação de pagamento.
                        </p>
                      </div>

                      <div className="mt-3 rounded-lg border border-field/15 bg-field/5 p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-ink">
                            Seu placar
                          </p>
                          <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-field shadow-sm">
                            {BRAZIL_FLAG} {brazilGoals || 0} x{" "}
                            {opponentGoals || 0} {game.opponentFlag}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                          <ScorePicker
                            label="Seleção"
                            teamName="Brasil"
                            flag={BRAZIL_FLAG}
                            value={brazilGoals}
                            disabled={game.isLocked}
                            onChange={setBrazilGoals}
                            onStep={(delta) =>
                              changeGoal(brazilGoals, setBrazilGoals, delta)
                            }
                          />
                          <div className="flex items-center justify-center">
                            <span className="rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white">
                              x
                            </span>
                          </div>
                          <ScorePicker
                            label="Adversário"
                            teamName={game.opponent}
                            flag={game.opponentFlag}
                            value={opponentGoals}
                            disabled={game.isLocked}
                            onChange={setOpponentGoals}
                            onStep={(delta) =>
                              changeGoal(opponentGoals, setOpponentGoals, delta)
                            }
                          />
                        </div>

                        {game.isLocked ? (
                          <p className="mt-3 rounded-md bg-canary/25 px-3 py-2 text-sm font-semibold text-ink">
                            As apostas deste jogo já estão fechadas para edição.
                          </p>
                        ) : null}
                      </div>
                    </details>
                  );
                })}

            <button
              type="submit"
              disabled={
                isBusy ||
                !player ||
                !player.poolId ||
                !selectedGame ||
                selectedGame.isLocked
              }
              className="h-11 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:bg-coal/30"
            >
              {editingPredictionId ? "Atualizar palpite" : "Salvar novo palpite"}
            </button>
            {editingPredictionId ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setEditingPredictionId("")}
                className="h-10 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-field hover:text-field disabled:text-coal/35"
              >
                Cancelar edição
              </button>
            ) : null}
              </form>
            </>
          ) : null}

          {message ? (
            <p className="mt-4 rounded-md border border-field/20 bg-field/5 px-3 py-2 text-sm font-semibold text-field">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}
        </section>

        {hasConfirmedPool ? (
        <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-ink">
              Pagamento de prêmios gerais
            </h2>
            <p className="text-sm text-coal/70">
              Resumo visual dos rateios por jogo. A regra de vencedores não foi
              alterada: vale o placar exato no tempo regulamentar.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {data.winners.length === 0 ? (
              <p className="rounded-md border border-line bg-mist px-3 py-4 text-sm text-coal/70">
                Nenhum pagamento de prêmio disponível ainda.
              </p>
            ) : null}
            {data.winners.map((winner) => (
              <article
                key={winner.gameId}
                className="rounded-lg border border-line bg-mist/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{winner.gameLabel}</p>
                    <p className="mt-1 text-sm text-coal/70">
                      Placar real: {winner.scoreLabel ?? "pendente"}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      winner.status === "HAS_WINNER"
                        ? "bg-field/10 text-field"
                        : winner.status === "NO_WINNER"
                          ? "bg-canary/25 text-ink"
                          : "bg-white text-coal"
                    }`}
                  >
                    {winner.status === "HAS_WINNER"
                      ? winner.shareAmountFormatted
                      : winner.status === "NO_WINNER"
                        ? "Sem vencedor"
                        : "Aguardando placar"}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm">
                  {winner.status === "HAS_WINNER"
                    ? winner.winners.map((playerWinner) => (
                        <div
                          key={playerWinner.playerId}
                          className="flex flex-wrap justify-between gap-2 rounded-md bg-white px-3 py-2 text-field"
                        >
                          <span className="font-semibold">
                            {playerWinner.name}
                          </span>
                          <span>
                            Palpite {playerWinner.predictionLabel} · Rateio{" "}
                            {winner.shareAmountFormatted}
                          </span>
                        </div>
                      ))
                    : null}
                  {winner.status === "NO_WINNER" ? (
                    <p className="rounded-md bg-white px-3 py-2 text-coal/70">
                      Sem vencedor neste jogo.
                    </p>
                  ) : null}
                  {winner.status === "PENDING_SCORE" ? (
                    <p className="rounded-md bg-white px-3 py-2 text-coal/70">
                      Aguardando placar real.
                    </p>
                  ) : null}
                </div>

                <p className="mt-3 text-xs font-semibold text-coal/60">
                  Prêmio do jogo: {formatBRL(winner.totalAmount)}
                </p>
              </article>
            ))}
          </div>
        </section>
        ) : null}
      </div>
      ) : null}

      {isPixOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pix-dialog-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 px-4 py-5 backdrop-blur-sm sm:items-center"
        >
          <div className="w-full max-w-md rounded-lg border border-line bg-white p-5 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id="pix-dialog-title"
                  className="text-lg font-semibold text-ink"
                >
                  Aposta salva
                </h3>
                <p className="mt-1 text-sm text-coal/70">
                  Depois do PIX, envie o comprovante no WhatsApp com o jogo
                  apostado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPixOpen(false);
                  setCopyMessage("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-lg font-semibold text-coal transition hover:border-field hover:text-field"
                aria-label="Fechar janela de PIX"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-field/20 bg-gradient-to-r from-field/10 via-white to-canary/20 px-4 py-5 text-center">
              <p className="text-xs font-semibold uppercase text-coal/60">
                Valor deste jogo
              </p>
              <p className="mt-1 text-4xl font-semibold text-field">
                {selectedGame?.valorBolaoFormatted ?? formatBRL(0)}
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {paymentGameLabel}
              </p>
            </div>

            <div className="mt-4 rounded-md border border-field/20 bg-field/5 p-3">
              <p className="text-xs font-semibold uppercase text-coal/60">
                Deposite o valor no PIX
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm">
                  {selectedPixKey} - {selectedPixOwner}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      selectedPixKey,
                      "Número PIX copiado."
                    )
                  }
                  className="h-9 rounded-md bg-field px-3 text-xs font-semibold text-white transition hover:bg-field/90"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-md border border-canary/30 bg-canary/15 p-3">
              <p className="text-xs font-semibold uppercase text-coal/60">
                Mensagem para enviar junto
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                Comprovante do palpite: {paymentGameLabel}
              </p>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `Comprovante do palpite: ${paymentGameLabel}`,
                    "Mensagem do jogo copiada."
                  )
                }
                className="mt-3 h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-field hover:text-field"
              >
                Copiar mensagem
              </button>
            </div>

            <p className="mt-3 text-sm text-coal/75">
              Envie o comprovante para {selectedPixKey} - {selectedPixOwner}.
            </p>
            {copyMessage ? (
              <p className="mt-3 rounded-md bg-mist px-3 py-2 text-sm font-semibold text-field">
                {copyMessage}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {pinModalAction ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-dialog-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 px-4 py-5 backdrop-blur-sm sm:items-center"
        >
          <form
            onSubmit={handlePinSubmit}
            className="w-full max-w-sm rounded-lg border border-line bg-white p-5 shadow-panel"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="pin-dialog-title" className="text-lg font-semibold text-ink">
                  Confirmar com senha
                </h3>
                <p className="mt-1 text-sm text-coal/70">
                  Digite sua senha de 4 números para gravar esta ação.
                </p>
              </div>
              <button
                type="button"
                onClick={closePinModal}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-lg font-semibold text-coal transition hover:border-field hover:text-field"
                aria-label="Fechar janela de senha"
              >
                ×
              </button>
            </div>

            <label className="mt-4 grid gap-1 text-sm font-semibold text-coal">
              Senha
              <input
                value={pin}
                onChange={(event) =>
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                autoFocus
                placeholder="0000"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                type="password"
                maxLength={4}
                className="h-11 rounded-md border border-line px-3 text-center text-lg font-semibold tracking-[0.35em] text-ink outline-none transition focus:border-field focus:ring-2 focus:ring-field/15"
              />
            </label>

            <button
              disabled={isBusy || !isPinReady}
              className="mt-4 h-11 w-full rounded-md bg-field px-4 text-sm font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
            >
              Confirmar
            </button>
          </form>
        </div>
      ) : null}

      {feedbackMessage ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-dialog-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 px-4 py-5 backdrop-blur-sm sm:items-center"
        >
          <div className="w-full max-w-sm rounded-lg border border-line bg-white p-5 text-center shadow-panel">
            <h3 id="feedback-dialog-title" className="text-lg font-semibold text-ink">
              {feedbackMessage}
            </h3>
            <button
              type="button"
              onClick={() => setFeedbackMessage("")}
              className="mt-4 h-10 rounded-md bg-field px-4 text-sm font-semibold text-white transition hover:bg-field/90"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
