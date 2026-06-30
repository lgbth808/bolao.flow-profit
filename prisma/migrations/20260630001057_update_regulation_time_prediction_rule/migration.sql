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
    "predictionRule" TEXT NOT NULL DEFAULT 'Vale apenas para palpites de 1º e 2º tempos.',
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
INSERT INTO "new_Game" ("apiFootballElapsed", "apiFootballFixtureId", "apiFootballStatusLong", "apiFootballStatusShort", "brazilScore", "createdAt", "finishedAt", "hidePredictionsUntilLocked", "id", "kickoffAt", "opponent", "opponentFlag", "opponentScore", "phase", "poolId", "predictionRule", "scoreLastSyncedAt", "scoreSourceUrl", "scoreSyncError", "scoreSyncStatus", "status", "updatedAt", "valorBolao") SELECT "apiFootballElapsed", "apiFootballFixtureId", "apiFootballStatusLong", "apiFootballStatusShort", "brazilScore", "createdAt", "finishedAt", "hidePredictionsUntilLocked", "id", "kickoffAt", "opponent", "opponentFlag", "opponentScore", "phase", "poolId", "predictionRule", "scoreLastSyncedAt", "scoreSourceUrl", "scoreSyncError", "scoreSyncStatus", "status", "updatedAt", "valorBolao" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE INDEX "Game_poolId_idx" ON "Game"("poolId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
