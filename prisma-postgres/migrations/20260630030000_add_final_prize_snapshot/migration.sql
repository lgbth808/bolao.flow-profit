ALTER TABLE "Game" ADD COLUMN "finalizedPrizeAmount" DECIMAL(10,2);
ALTER TABLE "Game" ADD COLUMN "finalizedWinningQuotaCount" INTEGER;
ALTER TABLE "Game" ADD COLUMN "finalizedWinningShareAmount" DECIMAL(10,2);
ALTER TABLE "Game" ADD COLUMN "finalizedWinningScoreLabel" TEXT;
ALTER TABLE "Game" ADD COLUMN "finalizedWinnersJson" TEXT;
ALTER TABLE "Game" ADD COLUMN "prizeFinalizedAt" TIMESTAMPTZ(6);
