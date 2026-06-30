const { PrismaClient, Prisma } = require("@prisma/client");
const { createHash } = require("crypto");

const prisma = new PrismaClient();
const PLAYER_PIN = "1234";

const GAME = {
  opponent: "Japão",
  opponentFlag: "🇯🇵",
  phase: "Jogo realizado",
  kickoffAt: new Date("2026-06-29T23:00:00.000Z"),
  valorBolao: "20.00",
  predictionRule: "Vale apenas para palpites de 1º e 2º tempos.",
  status: "ENCERRADO",
  brazilScore: 2,
  opponentScore: 1,
  finishedAt: new Date("2026-06-30T01:00:00.000Z"),
  hidePredictionsUntilLocked: true
};

const POOL = {
  name: "Bolão da d. Rosa do BRAASSSSSIIILLLLLLL",
  pixKey: "91 98258-5313",
  pixOwner: "Rosely Silva"
};

const ENTRIES = [
  { name: "Rosely", whatsapp: "91982000001", brazilGoals: 3, opponentGoals: 1 },
  { name: "Cleide", whatsapp: "91982000002", brazilGoals: 1, opponentGoals: 0 },
  { name: "Nana", whatsapp: "91982000003", brazilGoals: 2, opponentGoals: 1 },
  { name: "Nádia", whatsapp: "91982000004", brazilGoals: 4, opponentGoals: 1 },
  { name: "Nica", whatsapp: "91982000005", brazilGoals: 3, opponentGoals: 0 },
  { name: "Lorena", whatsapp: "91982000006", brazilGoals: 2, opponentGoals: 0 },
  { name: "Raphael", whatsapp: "91982000007", brazilGoals: 2, opponentGoals: 0 },
  { name: "Priscila", whatsapp: "91982000008", brazilGoals: 1, opponentGoals: 1 },
  { name: "Lineu", whatsapp: "91982000009", brazilGoals: 2, opponentGoals: 1 },
  { name: "Saulo", whatsapp: "91982000010", brazilGoals: 4, opponentGoals: 2 },
  { name: "Carlinho", whatsapp: "91982000011", brazilGoals: 3, opponentGoals: 2 },
  {
    name: "Carlinho",
    whatsapp: "91982000011",
    brazilGoals: 4,
    opponentGoals: 0
  },
  { name: "Natasha", whatsapp: "91982000013", brazilGoals: 3, opponentGoals: 1 }
];

function normalizedWhatsapp(nationalDigits) {
  return `55${nationalDigits}`;
}

function hashPlayerPin(pin) {
  return createHash("sha256")
    .update(`bolao-player:${process.env.PLAYER_PIN_SECRET || "bolao-pin-local"}:${pin}`)
    .digest("hex");
}

async function main() {
  await prisma.predictionAudit.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.player.deleteMany();
  await prisma.game.deleteMany();
  await prisma.pool.deleteMany();

  const pool = await prisma.pool.create({
    data: POOL
  });

  const game = await prisma.game.create({
    data: {
      ...GAME,
      poolId: pool.id
    }
  });

  const predictionCountByWhatsapp = ENTRIES.reduce((countByWhatsapp, entry) => {
    const whatsapp = normalizedWhatsapp(entry.whatsapp);
    countByWhatsapp.set(whatsapp, (countByWhatsapp.get(whatsapp) ?? 0) + 1);

    return countByWhatsapp;
  }, new Map());

  for (const entry of ENTRIES) {
    const whatsapp = normalizedWhatsapp(entry.whatsapp);
    const predictionCount = predictionCountByWhatsapp.get(whatsapp) ?? 1;
    const player = await prisma.player.upsert({
      where: { whatsapp },
      create: {
        name: entry.name,
        whatsapp,
        pinHash: hashPlayerPin(PLAYER_PIN),
        poolId: pool.id,
        valorPago: Number(GAME.valorBolao) * predictionCount
      },
      update: {
        name: entry.name,
        pinHash: hashPlayerPin(PLAYER_PIN),
        poolId: pool.id,
        valorPago: Number(GAME.valorBolao) * predictionCount
      }
    });

    await prisma.prediction.create({
      data: {
        playerId: player.id,
        gameId: game.id,
        brazilGoals: entry.brazilGoals,
        opponentGoals: entry.opponentGoals,
        paidAt: new Date()
      }
    });
  }

  const paidPredictions = await prisma.prediction.findMany({
    where: { gameId: game.id, paidAt: { not: null } },
    include: { player: true }
  });
  const winnersByWhatsapp = new Map();
  const prizeAmount = new Prisma.Decimal(GAME.valorBolao).mul(
    paidPredictions.length
  );

  for (const prediction of paidPredictions) {
    if (
      prediction.brazilGoals === GAME.brazilScore &&
      prediction.opponentGoals === GAME.opponentScore &&
      !winnersByWhatsapp.has(prediction.player.whatsapp)
    ) {
      winnersByWhatsapp.set(prediction.player.whatsapp, {
        playerId: prediction.playerId,
        name: prediction.player.name,
        whatsapp: prediction.player.whatsapp,
        predictionLabel: `${prediction.brazilGoals} x ${prediction.opponentGoals}`
      });
    }
  }

  const winners = Array.from(winnersByWhatsapp.values());

  await prisma.game.update({
    where: { id: game.id },
    data: {
      finalizedPrizeAmount: prizeAmount,
      finalizedWinningQuotaCount: winners.length,
      finalizedWinningShareAmount:
        winners.length > 0 ? prizeAmount.div(winners.length) : null,
      finalizedWinningScoreLabel: `${GAME.brazilScore} x ${GAME.opponentScore}`,
      finalizedWinnersJson: JSON.stringify(winners),
      prizeFinalizedAt: GAME.finishedAt
    }
  });

  console.log(
    `Seed concluido: Brasil x Japao com ${ENTRIES.length} palpites de R$20,00.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
