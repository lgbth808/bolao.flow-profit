-- Snapshot do prêmio no encerramento do jogo. Isso impede que baixas de
-- pagamento feitas depois do apito final mudem o rateio já cravado.
ALTER TABLE "Game" ADD COLUMN "finalizedPrizeAmount" DECIMAL;
ALTER TABLE "Game" ADD COLUMN "finalizedWinningQuotaCount" INTEGER;
ALTER TABLE "Game" ADD COLUMN "finalizedWinningShareAmount" DECIMAL;
ALTER TABLE "Game" ADD COLUMN "finalizedWinningScoreLabel" TEXT;
ALTER TABLE "Game" ADD COLUMN "finalizedWinnersJson" TEXT;
ALTER TABLE "Game" ADD COLUMN "prizeFinalizedAt" DATETIME;
