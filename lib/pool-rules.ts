export const PREDICTION_LOCK_MINUTES = 10;

export type GameStatusValue = "ABERTO" | "ENCERRADO" | "FINALIZADO";

export type GameRuleFields = {
  kickoffAt: Date | string;
  status: string;
};

export function getPredictionLockAt(kickoffAt: Date | string) {
  return new Date(new Date(kickoffAt).getTime() - PREDICTION_LOCK_MINUTES * 60_000);
}

export function isPredictionLocked(game: GameRuleFields, now = new Date()) {
  const lockAt = getPredictionLockAt(game.kickoffAt);

  // Regra central: o backend bloqueia edição por status manual e também
  // automaticamente 10 minutos antes do início do jogo.
  return game.status !== "ABERTO" || now >= lockAt;
}

export function gameStatusLabel(status: GameStatusValue) {
  const labels: Record<GameStatusValue, string> = {
    ABERTO: "Aberto",
    ENCERRADO: "Finalizado",
    FINALIZADO: "Finalizado"
  };

  return labels[status];
}
