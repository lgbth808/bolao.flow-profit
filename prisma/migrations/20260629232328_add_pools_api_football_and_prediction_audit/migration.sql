-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pixKey" TEXT NOT NULL DEFAULT '91 98258-5313',
    "pixOwner" TEXT NOT NULL DEFAULT 'Rosely Silva',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PredictionAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT,
    "opponent" TEXT NOT NULL,
    "opponentFlag" TEXT NOT NULL DEFAULT '🏁',
    "phase" TEXT NOT NULL,
    "kickoffAt" DATETIME NOT NULL,
    "valorBolao" DECIMAL NOT NULL DEFAULT 0.00,
    "predictionRule" TEXT NOT NULL DEFAULT 'Placar para os primeiro e segundo tempos apenas',
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "brazilScore" INTEGER DEFAULT 0,
    "opponentScore" INTEGER DEFAULT 0,
    "scoreSourceUrl" TEXT,
    "apiFootballFixtureId" TEXT,
    "apiFootballStatusShort" TEXT,
    "apiFootballStatusLong" TEXT,
    "apiFootballElapsed" INTEGER,
    "scoreLastSyncedAt" DATETIME,
    "scoreSyncStatus" TEXT,
    "scoreSyncError" TEXT,
    "finishedAt" DATETIME,
    "hidePredictionsUntilLocked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Game_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("brazilScore", "createdAt", "hidePredictionsUntilLocked", "id", "kickoffAt", "opponent", "opponentFlag", "opponentScore", "phase", "predictionRule", "scoreLastSyncedAt", "scoreSourceUrl", "scoreSyncError", "scoreSyncStatus", "status", "updatedAt", "valorBolao") SELECT "brazilScore", "createdAt", "hidePredictionsUntilLocked", "id", "kickoffAt", "opponent", "opponentFlag", "opponentScore", "phase", "predictionRule", "scoreLastSyncedAt", "scoreSourceUrl", "scoreSyncError", "scoreSyncStatus", "status", "updatedAt", "valorBolao" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE INDEX "Game_poolId_idx" ON "Game"("poolId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Pool_name_key" ON "Pool"("name");

-- CreateIndex
CREATE INDEX "PredictionAudit_predictionId_idx" ON "PredictionAudit"("predictionId");

-- CreateIndex
CREATE INDEX "PredictionAudit_playerId_idx" ON "PredictionAudit"("playerId");

-- CreateIndex
CREATE INDEX "PredictionAudit_gameId_idx" ON "PredictionAudit"("gameId");

-- CreateIndex
CREATE INDEX "PredictionAudit_createdAt_idx" ON "PredictionAudit"("createdAt");
