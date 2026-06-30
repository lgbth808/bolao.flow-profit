import type { GameStatusValue } from "./pool-rules";

export type PublicGame = {
  id: string;
  poolId: string | null;
  poolName: string | null;
  opponent: string;
  opponentFlag: string;
  phase: string;
  kickoffAt: string;
  lockAt: string;
  valorBolao: number;
  valorBolaoFormatted: string;
  predictionRule: string;
  status: GameStatusValue;
  statusLabel: string;
  brazilScore: number | null;
  opponentScore: number | null;
  scoreLabel: string;
  isScoreRevealed: boolean;
  scoreLastSyncedAt: string | null;
  scoreSyncStatus: string | null;
  scoreSyncError: string | null;
  apiFootballStatusShort: string | null;
  apiFootballStatusLong: string | null;
  apiFootballElapsed: number | null;
  finishedAt: string | null;
  newGameWhatsappSentAt: string | null;
  hidePredictionsUntilLocked: boolean;
  isLocked: boolean;
  predictionCount: number;
  paidPredictionCount: number;
  pendingPaymentCount: number;
  prizeAmount: number;
  prizeAmountFormatted: string;
  currentWinningScoreLabel: string | null;
  currentWinningQuotaCount: number;
  currentWinningShareAmount: number | null;
  currentWinningShareAmountFormatted: string | null;
  currentPrizeStatus: "WAITING" | "LIVE" | "FINAL";
};

export type PublicPool = {
  id: string;
  name: string;
  pixKey: string;
  pixOwner: string;
};

export type PublicPredictionCell = {
  gameId: string;
  display: string;
  isHidden: boolean;
  isOwn: boolean;
  isCurrentlyWinning: boolean;
  predictionCount: number;
  pendingPaymentCount: number;
};

export type PublicPlayer = {
  id: string;
  name: string;
  maskedWhatsapp: string;
  valorPago: number;
  valorPagoFormatted: string;
  predictions: PublicPredictionCell[];
};

export type PublicOwnPrediction = {
  id: string;
  gameId: string;
  brazilGoals: number;
  opponentGoals: number;
  label: string;
  isPaid: boolean;
  isCurrentlyWinning: boolean;
  updatedAt: string;
};

export type PublicWinner = {
  gameId: string;
  gameLabel: string;
  scoreLabel: string | null;
  winners: Array<{
    playerId: string;
    name: string;
    predictionLabel: string;
  }>;
  totalAmount: number;
  totalAmountFormatted: string;
  shareAmount: number | null;
  shareAmountFormatted: string | null;
  status: "PENDING_SCORE" | "NO_WINNER" | "HAS_WINNER";
};

export type PublicPoolData = {
  pools: PublicPool[];
  selectedPoolId: string | null;
  currentPlayerFound: boolean;
  currentPlayerPoolId: string | null;
  currentPlayerPoolName: string | null;
  games: PublicGame[];
  players: PublicPlayer[];
  totalAmount: number;
  totalAmountFormatted: string;
  totalPaidAmount: number;
  totalPaidAmountFormatted: string;
  totalPredictionCount: number;
  winners: PublicWinner[];
  currentPlayerPredictions: PublicOwnPrediction[];
};

export type AdminPrediction = {
  id: string;
  gameId: string;
  playerName: string;
  playerWhatsapp: string;
  gameLabel: string;
  predictionLabel: string;
  isPaid: boolean;
  updatedAt: string;
};

export type AdminFinanceEntry = {
  id: string;
  playerName: string;
  playerWhatsapp: string;
  gameLabel: string;
  predictionLabel: string;
  playerId: string;
  gameId: string;
  isPaid: boolean;
  paidAt: string | null;
  amount: number;
  amountFormatted: string;
};

export type AdminPlayer = {
  id: string;
  name: string;
  whatsapp: string;
  whatsappFormatted: string;
  poolName: string | null;
  valorPago: number;
};

export type AdminGame = PublicGame & {
  scoreSourceUrl: string | null;
  apiFootballFixtureId: string | null;
};

export type AdminPredictionAudit = {
  id: string;
  predictionId: string | null;
  playerName: string;
  playerWhatsapp: string;
  gameLabel: string;
  action: string;
  previousLabel: string | null;
  nextLabel: string | null;
  createdAt: string;
};

export type AdminPoolData = PublicPoolData & {
  adminGames: AdminGame[];
  adminPlayers: AdminPlayer[];
  adminPredictions: AdminPrediction[];
  adminFinanceEntries: AdminFinanceEntry[];
  adminPools: PublicPool[];
  apiFootballKeyConfigured: boolean;
  whatsappConfigured: boolean;
  predictionAudits: AdminPredictionAudit[];
};
