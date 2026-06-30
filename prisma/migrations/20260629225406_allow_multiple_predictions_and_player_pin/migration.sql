-- DropIndex
DROP INDEX "Prediction_playerId_gameId_key";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL DEFAULT '',
    "valorPago" DECIMAL NOT NULL DEFAULT 0.00,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Player" ("createdAt", "id", "name", "updatedAt", "valorPago", "whatsapp") SELECT "createdAt", "id", "name", "updatedAt", "valorPago", "whatsapp" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_whatsapp_key" ON "Player"("whatsapp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
