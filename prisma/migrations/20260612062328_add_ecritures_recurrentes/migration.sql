-- CreateEnum
CREATE TYPE "Frequence" AS ENUM ('QUOTIDIEN', 'HEBDOMADAIRE', 'MENSUEL', 'TRIMESTRIEL', 'ANNUEL');

-- CreateTable
CREATE TABLE "EcritureRecurrente" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "frequence" "Frequence" NOT NULL,
    "prochainExecution" TIMESTAMP(3) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "journalId" INTEGER,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcritureRecurrente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneRecurrente" (
    "id" SERIAL NOT NULL,
    "ecritureId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "debit" INTEGER NOT NULL,
    "credit" INTEGER NOT NULL,
    "codeTva" "CodeTva",

    CONSTRAINT "LigneRecurrente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EcritureRecurrente_userId_idx" ON "EcritureRecurrente"("userId");

-- CreateIndex
CREATE INDEX "EcritureRecurrente_actif_prochainExecution_idx" ON "EcritureRecurrente"("actif", "prochainExecution");

-- AddForeignKey
ALTER TABLE "EcritureRecurrente" ADD CONSTRAINT "EcritureRecurrente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneRecurrente" ADD CONSTRAINT "LigneRecurrente_ecritureId_fkey" FOREIGN KEY ("ecritureId") REFERENCES "EcritureRecurrente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
