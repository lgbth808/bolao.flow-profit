-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opponent" TEXT NOT NULL,
    "opponentFlag" TEXT NOT NULL DEFAULT '🏁',
    "phase" TEXT NOT NULL,
    "kickoffAt" DATETIME NOT NULL,
    "valorBolao" DECIMAL NOT NULL DEFAULT 0.00,
    "predictionRule" TEXT NOT NULL DEFAULT 'Placar para os primeiro e segundo tempos apenas',
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "brazilScore" INTEGER,
    "opponentScore" INTEGER,
    "hidePredictionsUntilLocked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Game" ("brazilScore", "createdAt", "hidePredictionsUntilLocked", "id", "kickoffAt", "opponent", "opponentScore", "phase", "predictionRule", "status", "updatedAt", "valorBolao") SELECT "brazilScore", "createdAt", "hidePredictionsUntilLocked", "id", "kickoffAt", "opponent", "opponentScore", "phase", "predictionRule", "status", "updatedAt", "valorBolao" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
