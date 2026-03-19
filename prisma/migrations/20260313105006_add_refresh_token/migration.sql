/*
  Warnings:

  - A unique constraint covering the columns `[userId,code]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Account_code_key";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "userId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Evenement" ADD COLUMN     "userId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "userId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "JournalLine" ADD COLUMN     "lettre" TEXT;

-- AlterTable
ALTER TABLE "Objectif" ADD COLUMN     "userId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Operation" ADD COLUMN     "userId" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Tiers" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "siret" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "accountId" INTEGER,
    "userId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dateEcheance" TIMESTAMP(3),
    "montant" INTEGER NOT NULL,
    "statut" TEXT NOT NULL,
    "notes" TEXT,
    "tiersId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "montant" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "reference" TEXT,
    "factureId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" INTEGER,
    "details" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_code_key" ON "Account"("userId", "code");

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tiers" ADD CONSTRAINT "Tiers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tiers" ADD CONSTRAINT "Tiers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_tiersId_fkey" FOREIGN KEY ("tiersId") REFERENCES "Tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objectif" ADD CONSTRAINT "Objectif_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
