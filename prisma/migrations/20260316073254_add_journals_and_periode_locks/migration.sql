-- CreateEnum
CREATE TYPE "JournalType" AS ENUM ('ACHATS', 'VENTES', 'BANQUE', 'CAISSE', 'OD');

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "journalId" INTEGER,
ADD COLUMN     "pieceNumber" TEXT;

-- CreateTable
CREATE TABLE "Journal" (
    "id" SERIAL NOT NULL,
    "type" "JournalType" NOT NULL,
    "userId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodeLock" (
    "id" SERIAL NOT NULL,
    "annee" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL DEFAULT 1,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodeLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Journal_type_userId_key" ON "Journal"("type", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodeLock_annee_mois_userId_key" ON "PeriodeLock"("annee", "mois", "userId");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodeLock" ADD CONSTRAINT "PeriodeLock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
