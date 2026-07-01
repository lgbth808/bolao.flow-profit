import { prisma } from "./prisma";

type AuditPlayer = {
  id: string;
  name: string;
  whatsapp: string;
};

type AuditGame = {
  id: string;
  opponent: string;
};

type AuditScore = {
  brazilGoals: number;
  opponentGoals: number;
} | null;

export async function recordPredictionAudit({
  predictionId,
  player,
  game,
  action,
  previous,
  next
}: {
  predictionId?: string | null;
  player: AuditPlayer;
  game: AuditGame;
  action: "CRIADO" | "EDITADO" | "EXCLUIDO" | "EXCLUIDO_ADMIN";
  previous: AuditScore;
  next: AuditScore;
}) {
  // Trilha de auditoria: registra antes/depois das operacoes sensiveis de
  // palpite para permitir conferencia posterior pelo admin.
  await prisma.predictionAudit.create({
    data: {
      predictionId: predictionId ?? null,
      playerId: player.id,
      playerName: player.name,
      playerWhatsapp: player.whatsapp,
      gameId: game.id,
      gameLabel: `Brasil x ${game.opponent}`,
      action,
      previousBrazilGoals: previous?.brazilGoals ?? null,
      previousOpponentGoals: previous?.opponentGoals ?? null,
      nextBrazilGoals: next?.brazilGoals ?? null,
      nextOpponentGoals: next?.opponentGoals ?? null
    }
  });
}
