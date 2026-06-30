import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getApiFootballKey } from "./settings";
import { getWhatsappConfig } from "./whatsapp";
import { formatBRL } from "./money";
import { formatBrazilianWhatsapp, maskBrazilianWhatsapp } from "./phone";
import { DEFAULT_OPPONENT_FLAG, getOpponentFlag } from "./flags";
import { parseFinalizedWinners } from "./prize";
import {
  type GameStatusValue,
  gameStatusLabel,
  getPredictionLockAt,
  isPredictionLocked
} from "./pool-rules";
import { shouldRevealPublicScore, syncDueGameScores } from "./score-sync";
import type { AdminPoolData, PublicGame, PublicPoolData } from "./types";

type PublicPoolDataOptions = {
  poolId?: string;
  includePrivateScores?: boolean;
  includeAllPools?: boolean;
};

const gameReadSelect = {
  id: true,
  poolId: true,
  opponent: true,
  opponentFlag: true,
  phase: true,
  kickoffAt: true,
  valorBolao: true,
  predictionRule: true,
  status: true,
  brazilScore: true,
  opponentScore: true,
  scoreSourceUrl: true,
  apiFootballFixtureId: true,
  apiFootballStatusShort: true,
  apiFootballStatusLong: true,
  apiFootballElapsed: true,
  scoreLastSyncedAt: true,
  scoreSyncStatus: true,
  scoreSyncError: true,
  finishedAt: true,
  newGameWhatsappSentAt: true,
  hidePredictionsUntilLocked: true,
  createdAt: true,
  updatedAt: true,
  pool: {
    select: {
      id: true,
      name: true
    }
  },
  predictions: {
    select: {
      id: true,
      playerId: true,
      gameId: true,
      brazilGoals: true,
      opponentGoals: true,
      paidAt: true,
      createdAt: true,
      updatedAt: true,
      player: {
        select: {
          id: true,
          name: true,
          whatsapp: true
        }
      }
    }
  }
} satisfies Prisma.GameSelect;

const predictionGameSummarySelect = {
  id: true,
  poolId: true,
  opponent: true,
  valorBolao: true,
  pool: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.GameSelect;

const finalPrizeSnapshotFallback = {
  finalizedPrizeAmount: null,
  finalizedWinningQuotaCount: null,
  finalizedWinningShareAmount: null,
  finalizedWinningScoreLabel: null,
  finalizedWinnersJson: null,
  prizeFinalizedAt: null
};

type GameReadRecord = Prisma.GameGetPayload<{
  select: typeof gameReadSelect;
}> &
  typeof finalPrizeSnapshotFallback;

function withFinalPrizeSnapshotFallback<T extends object>(game: T) {
  return {
    ...finalPrizeSnapshotFallback,
    ...game
  } as T & typeof finalPrizeSnapshotFallback;
}

function formatPredictionLabel(
  prediction: { brazilGoals: number; opponentGoals: number } | null
) {
  if (!prediction) {
    return null;
  }

  return `${prediction.brazilGoals} x ${prediction.opponentGoals}`;
}

function canEvaluatePrizeScore(
  game: {
    kickoffAt: Date;
    finishedAt?: Date | null;
    brazilScore?: number | null;
    opponentScore?: number | null;
  },
  shouldRevealScore: boolean
) {
  const hasGameStarted = new Date().getTime() >= game.kickoffAt.getTime();

  return Boolean(
    shouldRevealScore &&
      (hasGameStarted || game.finishedAt) &&
      game.brazilScore !== null &&
      game.brazilScore !== undefined &&
      game.opponentScore !== null &&
      game.opponentScore !== undefined
  );
}

function isPaidPredictionWinning(
  prediction: {
    paidAt?: Date | null;
    brazilGoals: number;
    opponentGoals: number;
  },
  game: {
    brazilScore?: number | null;
    opponentScore?: number | null;
  },
  canEvaluate: boolean
) {
  return Boolean(
    canEvaluate &&
      prediction.paidAt &&
      prediction.brazilGoals === game.brazilScore &&
      prediction.opponentGoals === game.opponentScore
  );
}

function isPredictionWinningForDisplay(
  prediction: {
    playerId?: string;
    paidAt?: Date | null;
    brazilGoals: number;
    opponentGoals: number;
  },
  game: {
    brazilScore?: number | null;
    opponentScore?: number | null;
    prizeFinalizedAt?: Date | null;
    finalizedWinnersJson?: string | null;
  },
  canEvaluate: boolean,
  playerWhatsapp?: string | null
) {
  if (game.prizeFinalizedAt) {
    const finalizedWinnerKeys = new Set(
      parseFinalizedWinners(game.finalizedWinnersJson).flatMap((winner) => [
        winner.whatsapp,
        winner.playerId
      ])
    );

    return Boolean(
      canEvaluate &&
        prediction.brazilGoals === game.brazilScore &&
        prediction.opponentGoals === game.opponentScore &&
        (finalizedWinnerKeys.has(playerWhatsapp ?? "") ||
          finalizedWinnerKeys.has(prediction.playerId ?? ""))
    );
  }

  return isPaidPredictionWinning(prediction, game, canEvaluate);
}

function publicGameFromRecord(
  game: GameReadRecord,
  options: { includePrivateScores?: boolean }
): PublicGame {
  const lockAt = getPredictionLockAt(game.kickoffAt);
  const shouldRevealScore =
    options.includePrivateScores || shouldRevealPublicScore(game.kickoffAt);
  const predictionCount = game.predictions.length;
  const paidPredictionCount = game.predictions.filter(
    (prediction) => prediction.paidAt
  ).length;
  const pendingPaymentCount = predictionCount - paidPredictionCount;
  const livePrizeAmount = Number(game.valorBolao) * paidPredictionCount;
  const canEvaluatePrize = canEvaluatePrizeScore(game, shouldRevealScore);
  const winningQuotaByWhatsapp = new Set<string>();
  const hasFinalPrizeSnapshot = Boolean(game.prizeFinalizedAt);

  if (canEvaluatePrize) {
    for (const prediction of game.predictions) {
      if (
        isPredictionWinningForDisplay(
          prediction,
          game,
          canEvaluatePrize,
          prediction.player?.whatsapp
        )
      ) {
        winningQuotaByWhatsapp.add(
          prediction.player?.whatsapp ??
            prediction.playerId ??
            `${prediction.brazilGoals}x${prediction.opponentGoals}`
        );
      }
    }
  }

  const prizeAmount =
    hasFinalPrizeSnapshot && game.finalizedPrizeAmount !== null
      ? Number(game.finalizedPrizeAmount)
      : livePrizeAmount;
  const currentWinningQuotaCount =
    hasFinalPrizeSnapshot && game.finalizedWinningQuotaCount !== null
      ? game.finalizedWinningQuotaCount
      : winningQuotaByWhatsapp.size;
  const currentWinningShareAmount =
    hasFinalPrizeSnapshot
      ? game.finalizedWinningShareAmount === null
        ? null
        : Number(game.finalizedWinningShareAmount)
      : currentWinningQuotaCount > 0
        ? prizeAmount / currentWinningQuotaCount
        : null;
  const inferredOpponentFlag = getOpponentFlag(game.opponent);
  const opponentFlag =
    inferredOpponentFlag === DEFAULT_OPPONENT_FLAG
      ? game.opponentFlag || inferredOpponentFlag
      : inferredOpponentFlag;

  return {
    id: game.id,
    poolId: game.poolId,
    poolName: game.pool?.name ?? null,
    opponent: game.opponent,
    opponentFlag,
    phase: game.phase,
    kickoffAt: game.kickoffAt.toISOString(),
    lockAt: lockAt.toISOString(),
    valorBolao: Number(game.valorBolao),
    valorBolaoFormatted: formatBRL(Number(game.valorBolao)),
    predictionRule: game.predictionRule,
    status: game.status as GameStatusValue,
    statusLabel: gameStatusLabel(game.status as GameStatusValue),
    brazilScore: shouldRevealScore ? game.brazilScore : null,
    opponentScore: shouldRevealScore ? game.opponentScore : null,
    scoreLabel: shouldRevealScore
      ? `${game.brazilScore ?? 0} x ${game.opponentScore ?? 0}`
      : "0 x 0",
    isScoreRevealed: shouldRevealScore,
    scoreLastSyncedAt: game.scoreLastSyncedAt?.toISOString() ?? null,
    scoreSyncStatus: game.scoreSyncStatus,
    scoreSyncError: options.includePrivateScores ? game.scoreSyncError : null,
    apiFootballStatusShort: game.apiFootballStatusShort,
    apiFootballStatusLong: game.apiFootballStatusLong,
    apiFootballElapsed: game.apiFootballElapsed,
    finishedAt: game.finishedAt?.toISOString() ?? null,
    newGameWhatsappSentAt: game.newGameWhatsappSentAt?.toISOString() ?? null,
    hidePredictionsUntilLocked: game.hidePredictionsUntilLocked,
    isLocked: isPredictionLocked(game),
    predictionCount,
    paidPredictionCount,
    pendingPaymentCount,
    prizeAmount,
    prizeAmountFormatted: formatBRL(prizeAmount),
    currentWinningScoreLabel: canEvaluatePrize
      ? game.finalizedWinningScoreLabel ??
        `${game.brazilScore ?? 0} x ${game.opponentScore ?? 0}`
      : null,
    currentWinningQuotaCount,
    currentWinningShareAmount,
    currentWinningShareAmountFormatted:
      currentWinningShareAmount === null
        ? null
        : formatBRL(currentWinningShareAmount),
    currentPrizeStatus: !canEvaluatePrize
      ? "WAITING"
      : game.finishedAt || hasFinalPrizeSnapshot
        ? "FINAL"
        : "LIVE"
  };
}

export async function getPublicPoolData(
  currentPlayerId?: string,
  options: PublicPoolDataOptions = {}
): Promise<PublicPoolData> {
  // Sincronização oportunista: quando a página/API é acessada, o backend
  // atualiza somente fixtures cadastrados, respeitando intervalo e janela.
  await syncDueGameScores();

  const pools = await prisma.pool.findMany({
    orderBy: [{ createdAt: "asc" }, { name: "asc" }]
  });
  const currentPlayer = currentPlayerId
    ? await prisma.player.findUnique({
        where: { id: currentPlayerId },
        include: { pool: true }
      })
    : null;
  const selectedPoolId = options.includeAllPools
    ? null
    : currentPlayer?.poolId
      ? currentPlayer.poolId
      : options.poolId && pools.some((pool) => pool.id === options.poolId)
      ? options.poolId
      : pools[0]?.id ?? null;
  const gameWhere =
    selectedPoolId && !options.includeAllPools ? { poolId: selectedPoolId } : {};
  const playerWhere =
    selectedPoolId && !options.includeAllPools ? { poolId: selectedPoolId } : {};

  const [players, rawGames] = await Promise.all([
    prisma.player.findMany({
      where: playerWhere,
      include: { predictions: true },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }]
    }),
    prisma.game.findMany({
      where: gameWhere,
      select: gameReadSelect,
      orderBy: [{ kickoffAt: "asc" }, { createdAt: "asc" }]
    })
  ]);
  const games = rawGames.map(withFinalPrizeSnapshotFallback);

  const gameIds = new Set(games.map((game) => game.id));
  const totalPrizeAmount = games.reduce(
    (sum, game) =>
      sum +
      Number(game.valorBolao) *
        game.predictions.filter((prediction) => prediction.paidAt).length,
    0
  );
  const totalAmount = totalPrizeAmount;
  const totalPredictionCount = games.reduce(
    (sum, game) => sum + game.predictions.length,
    0
  );

  const publicGames = games.map((game) =>
    publicGameFromRecord(game, {
      includePrivateScores: options.includePrivateScores
    })
  );

  const publicPlayers = players.map((player) => ({
    id: player.id,
    name: player.name,
    maskedWhatsapp: maskBrazilianWhatsapp(player.whatsapp),
    valorPago: Number(player.valorPago),
    valorPagoFormatted: formatBRL(Number(player.valorPago)),
    predictions: games.map((game) => {
      const predictions = player.predictions
        .filter((item) => item.gameId === game.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const isOwn = player.id === currentPlayerId;
      const canEvaluatePrize = canEvaluatePrizeScore(
        game,
        options.includePrivateScores || shouldRevealPublicScore(game.kickoffAt)
      );
      const isCurrentlyWinning = predictions.some((prediction) =>
        isPredictionWinningForDisplay(
          prediction,
          game,
          canEvaluatePrize,
          player.whatsapp
        )
      );
      const shouldHide =
        predictions.length > 0 &&
        !isOwn &&
        game.hidePredictionsUntilLocked &&
        !shouldRevealPublicScore(game.kickoffAt);
      const visibleDisplay = predictions
        .map(
          (prediction) =>
            `${prediction.brazilGoals} x ${prediction.opponentGoals}${prediction.paidAt ? "" : "*"}`
        )
        .join(" · ");
      const pendingPaymentCount = predictions.filter(
        (prediction) => !prediction.paidAt
      ).length;

      return {
        gameId: game.id,
        display: predictions.length === 0
          ? "-"
          : shouldHide
            ? predictions.length > 1
              ? `?? x ?? (${predictions.length})`
              : "?? x ??"
            : visibleDisplay,
        isHidden: shouldHide,
        isOwn,
        isCurrentlyWinning,
        predictionCount: predictions.length,
        pendingPaymentCount
      };
    })
  })).sort((first, second) => {
    if (first.id === currentPlayerId) {
      return -1;
    }

    if (second.id === currentPlayerId) {
      return 1;
    }

    return first.name.localeCompare(second.name, "pt-BR");
  });

  const currentPlayerPredictions =
    players
      .find((player) => player.id === currentPlayerId)
      ?.predictions.filter((prediction) => gameIds.has(prediction.gameId))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((prediction) => {
        const game = games.find((item) => item.id === prediction.gameId);
        const canEvaluatePrize = game
          ? canEvaluatePrizeScore(
              game,
              options.includePrivateScores || shouldRevealPublicScore(game.kickoffAt)
            )
          : false;

        return {
          id: prediction.id,
          gameId: prediction.gameId,
          brazilGoals: prediction.brazilGoals,
          opponentGoals: prediction.opponentGoals,
          label: `${prediction.brazilGoals} x ${prediction.opponentGoals}${prediction.paidAt ? "" : "*"}`,
          isPaid: Boolean(prediction.paidAt),
          isCurrentlyWinning: game
            ? isPredictionWinningForDisplay(
                prediction,
                game,
                canEvaluatePrize,
                currentPlayer?.whatsapp
              )
            : false,
          updatedAt: prediction.updatedAt.toISOString()
        };
      }) ?? [];

  const winners = games.map((game) => {
    const hasFinalScore =
      game.finishedAt !== null &&
      game.brazilScore !== null &&
      game.opponentScore !== null;
    const shouldRevealScore =
      options.includePrivateScores || shouldRevealPublicScore(game.kickoffAt);
    const finalizedWinners = parseFinalizedWinners(game.finalizedWinnersJson);
    const hasFinalPrizeSnapshot = Boolean(game.prizeFinalizedAt);
    const paidPredictions = game.predictions.filter(
      (prediction) => prediction.paidAt
    );
    const livePrizeAmount = Number(game.valorBolao) * paidPredictions.length;
    const prizeAmount =
      hasFinalPrizeSnapshot && game.finalizedPrizeAmount !== null
        ? Number(game.finalizedPrizeAmount)
        : livePrizeAmount;
    const exactWinnerPredictions =
      hasFinalScore && shouldRevealScore && !hasFinalPrizeSnapshot
        ? paidPredictions.filter(
            (prediction) =>
              prediction.brazilGoals === game.brazilScore &&
              prediction.opponentGoals === game.opponentScore
          )
        : [];
    const winnerByWhatsapp = new Map<
      string,
      {
        playerId: string;
        name: string;
        predictionLabel: string;
      }
    >();

    for (const prediction of exactWinnerPredictions) {
      if (!winnerByWhatsapp.has(prediction.player.whatsapp)) {
        winnerByWhatsapp.set(prediction.player.whatsapp, {
          playerId: prediction.playerId,
          name: prediction.player.name,
          predictionLabel: `${prediction.brazilGoals} x ${prediction.opponentGoals}`
        });
      }
    }

    const exactWinners = hasFinalPrizeSnapshot
      ? finalizedWinners.map((winner) => ({
          playerId: winner.playerId,
          name: winner.name,
          predictionLabel: winner.predictionLabel
        }))
      : Array.from(winnerByWhatsapp.values());
    const shareAmount =
      hasFinalPrizeSnapshot
        ? game.finalizedWinningShareAmount === null
          ? null
          : Number(game.finalizedWinningShareAmount)
        : exactWinners.length > 0
          ? prizeAmount / exactWinners.length
          : null;

    return {
      gameId: game.id,
      gameLabel: `Brasil x ${game.opponent}`,
      scoreLabel:
        hasFinalScore && shouldRevealScore
          ? game.finalizedWinningScoreLabel ??
            `${game.brazilScore} x ${game.opponentScore}`
          : null,
      winners: exactWinners,
      totalAmount: prizeAmount,
      totalAmountFormatted: formatBRL(prizeAmount),
      shareAmount,
      shareAmountFormatted: shareAmount === null ? null : formatBRL(shareAmount),
      status: !hasFinalScore || !shouldRevealScore
        ? "PENDING_SCORE"
        : exactWinners.length === 0
          ? "NO_WINNER"
          : "HAS_WINNER"
    } as const;
  });

  return {
    pools: pools.map((pool) => ({
      id: pool.id,
      name: pool.name,
      pixKey: pool.pixKey,
      pixOwner: pool.pixOwner
    })),
    selectedPoolId,
    currentPlayerFound: currentPlayerId ? Boolean(currentPlayer) : false,
    currentPlayerPoolId: currentPlayer?.poolId ?? null,
    currentPlayerPoolName: currentPlayer?.pool?.name ?? null,
    games: publicGames,
    players: publicPlayers,
    totalAmount: totalPrizeAmount,
    totalAmountFormatted: formatBRL(totalPrizeAmount),
    totalPaidAmount: totalAmount,
    totalPaidAmountFormatted: formatBRL(totalAmount),
    totalPredictionCount,
    winners,
    currentPlayerPredictions
  };
}

export async function getAdminPoolData(): Promise<AdminPoolData> {
  const publicData = await getPublicPoolData(undefined, {
    includePrivateScores: true,
    includeAllPools: true
  });
  const [players, predictions, rawGames, pools, apiFootballKey, whatsappConfig, audits] =
    await Promise.all([
      prisma.player.findMany({
        include: { pool: true },
        orderBy: [{ name: "asc" }, { createdAt: "asc" }]
      }),
      prisma.prediction.findMany({
        include: {
          player: true,
          game: {
            select: predictionGameSummarySelect
          }
        },
        orderBy: [{ updatedAt: "desc" }]
      }),
      prisma.game.findMany({
        select: gameReadSelect,
        orderBy: [{ kickoffAt: "asc" }, { createdAt: "asc" }]
      }),
      prisma.pool.findMany({
        orderBy: [{ createdAt: "asc" }, { name: "asc" }]
      }),
      getApiFootballKey(),
      getWhatsappConfig(),
      prisma.predictionAudit.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 80
      })
    ]);
  const games = rawGames.map(withFinalPrizeSnapshotFallback);

  return {
    ...publicData,
    adminGames: games.map((game) => ({
      ...publicGameFromRecord(game, { includePrivateScores: true }),
      scoreSourceUrl: game.scoreSourceUrl,
      apiFootballFixtureId: game.apiFootballFixtureId
    })),
    adminPlayers: players.map((player) => ({
      id: player.id,
      name: player.name,
      whatsapp: player.whatsapp,
      whatsappFormatted: formatBrazilianWhatsapp(player.whatsapp),
      poolName: player.pool?.name ?? null,
      valorPago: Number(player.valorPago)
    })),
    adminPredictions: predictions.map((prediction) => ({
      id: prediction.id,
      gameId: prediction.gameId,
      playerName: prediction.player.name,
      playerWhatsapp: formatBrazilianWhatsapp(prediction.player.whatsapp),
      gameLabel: `${prediction.game.pool?.name ? `${prediction.game.pool.name} · ` : ""}Brasil x ${prediction.game.opponent}`,
      predictionLabel: `${prediction.brazilGoals} x ${prediction.opponentGoals}${prediction.paidAt ? "" : "*"}`,
      isPaid: Boolean(prediction.paidAt),
      updatedAt: prediction.updatedAt.toISOString()
    })),
    adminFinanceEntries: predictions.map((prediction) => ({
      id: prediction.id,
      playerId: prediction.playerId,
      gameId: prediction.gameId,
      playerName: prediction.player.name,
      playerWhatsapp: formatBrazilianWhatsapp(prediction.player.whatsapp),
      gameLabel: `${prediction.game.pool?.name ? `${prediction.game.pool.name} · ` : ""}Brasil x ${prediction.game.opponent}`,
      predictionLabel: `${prediction.brazilGoals} x ${prediction.opponentGoals}${prediction.paidAt ? "" : "*"}`,
      isPaid: Boolean(prediction.paidAt),
      paidAt: prediction.paidAt?.toISOString() ?? null,
      amount: Number(prediction.game.valorBolao),
      amountFormatted: formatBRL(Number(prediction.game.valorBolao))
    })),
    adminPools: pools.map((pool) => ({
      id: pool.id,
      name: pool.name,
      pixKey: pool.pixKey,
      pixOwner: pool.pixOwner
    })),
    apiFootballKeyConfigured: Boolean(apiFootballKey),
    whatsappConfigured: Boolean(
      whatsappConfig.baseUrl &&
        whatsappConfig.instanceName &&
        whatsappConfig.apiKey &&
        whatsappConfig.siteUrl
    ),
    predictionAudits: audits.map((audit) => ({
      id: audit.id,
      predictionId: audit.predictionId,
      playerName: audit.playerName,
      playerWhatsapp: formatBrazilianWhatsapp(audit.playerWhatsapp),
      gameLabel: audit.gameLabel,
      action: audit.action,
      previousLabel: formatPredictionLabel(
        audit.previousBrazilGoals === null || audit.previousOpponentGoals === null
          ? null
          : {
              brazilGoals: audit.previousBrazilGoals,
              opponentGoals: audit.previousOpponentGoals
            }
      ),
      nextLabel: formatPredictionLabel(
        audit.nextBrazilGoals === null || audit.nextOpponentGoals === null
          ? null
          : {
              brazilGoals: audit.nextBrazilGoals,
              opponentGoals: audit.nextOpponentGoals
            }
      ),
      createdAt: audit.createdAt.toISOString()
    }))
  };
}
