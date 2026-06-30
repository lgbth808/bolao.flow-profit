-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL DEFAULT '',
    "valorPago" DECIMAL NOT NULL DEFAULT 0.00,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("createdAt", "id", "name", "pinHash", "updatedAt", "valorPago", "whatsapp") SELECT "createdAt", "id", "name", "pinHash", "updatedAt", "valorPago", "whatsapp" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_whatsapp_key" ON "Player"("whatsapp");
CREATE INDEX "Player_poolId_idx" ON "Player"("poolId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
