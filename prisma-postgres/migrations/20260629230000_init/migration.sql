CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "poolId" TEXT,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL DEFAULT '',
    "valorPago" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pixKey" TEXT NOT NULL DEFAULT '91 98258-5313',
    "pixOwner" TEXT NOT NULL DEFAULT 'Rosely Silva',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "poolId" TEXT,
    "opponent" TEXT NOT NULL,
    "opponentFlag" TEXT NOT NULL DEFAULT '🏁',
    "phase" TEXT NOT NULL,
    "kickoffAt" TIMESTAMPTZ(6) NOT NULL,
    "valorBolao" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "predictionRule" TEXT NOT NULL DEFAULT 'Vale apenas para palpites de 1º e 2º tempos.',
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "brazilScore" INTEGER DEFAULT 0,
    "opponentScore" INTEGER DEFAULT 0,
    "scoreSourceUrl" TEXT,
    "apiFootballFixtureId" TEXT,
    "apiFootballStatusShort" TEXT,
    "apiFootballStatusLong" TEXT,
    "apiFootballElapsed" INTEGER,
    "scoreLastSyncedAt" TIMESTAMPTZ(6),
    "scoreSyncStatus" TEXT,
    "scoreSyncError" TEXT,
    "finishedAt" TIMESTAMPTZ(6),
    "newGameWhatsappSentAt" TIMESTAMPTZ(6),
    "hidePredictionsUntilLocked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "brazilGoals" INTEGER NOT NULL,
    "opponentGoals" INTEGER NOT NULL,
    "paidAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PredictionAudit" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "playerWhatsapp" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameLabel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousBrazilGoals" INTEGER,
    "previousOpponentGoals" INTEGER,
    "nextBrazilGoals" INTEGER,
    "nextOpponentGoals" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionAudit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "Player_whatsapp_key" ON "Player"("whatsapp");
CREATE INDEX "Player_poolId_idx" ON "Player"("poolId");
CREATE UNIQUE INDEX "Pool_name_key" ON "Pool"("name");
CREATE INDEX "Game_poolId_idx" ON "Game"("poolId");
CREATE INDEX "PredictionAudit_predictionId_idx" ON "PredictionAudit"("predictionId");
CREATE INDEX "PredictionAudit_playerId_idx" ON "PredictionAudit"("playerId");
CREATE INDEX "PredictionAudit_gameId_idx" ON "PredictionAudit"("gameId");
CREATE INDEX "PredictionAudit_createdAt_idx" ON "PredictionAudit"("createdAt");

ALTER TABLE "Game" ADD CONSTRAINT "Game_poolId_fkey"
FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Player" ADD CONSTRAINT "Player_poolId_fkey"
FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_playerId_fkey"
FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_gameId_fkey"
FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
