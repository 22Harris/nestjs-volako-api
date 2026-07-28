-- CreateEnum
CREATE TYPE "MethodeAmortissement" AS ENUM ('LINEAIRE', 'DEGRESSIF');

-- CreateEnum
CREATE TYPE "StatutImmobilisation" AS ENUM ('ACTIF', 'CEDE');

-- CreateTable
CREATE TABLE "Immobilisation" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "dateAcquisition" TIMESTAMP(3) NOT NULL,
    "valeurBrute" INTEGER NOT NULL,
    "dureeAmortissement" INTEGER NOT NULL,
    "methode" "MethodeAmortissement" NOT NULL DEFAULT 'LINEAIRE',
    "compteBilanCode" TEXT NOT NULL,
    "compteAmortissementCode" TEXT NOT NULL,
    "compteChargeCode" TEXT NOT NULL,
    "statut" "StatutImmobilisation" NOT NULL DEFAULT 'ACTIF',
    "dateCession" TIMESTAMP(3),
    "prixCession" INTEGER,
    "userId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Immobilisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneAmortissement" (
    "id" SERIAL NOT NULL,
    "immobilisationId" INTEGER NOT NULL,
    "exercice" INTEGER NOT NULL,
    "dotation" INTEGER NOT NULL,
    "cumulAmortissement" INTEGER NOT NULL,
    "valeurNetteComptable" INTEGER NOT NULL,
    "comptabilisee" BOOLEAN NOT NULL DEFAULT false,
    "journalEntryId" INTEGER,

    CONSTRAINT "LigneAmortissement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Immobilisation_userId_idx" ON "Immobilisation"("userId");

-- CreateIndex
CREATE INDEX "LigneAmortissement_immobilisationId_idx" ON "LigneAmortissement"("immobilisationId");

-- CreateIndex
CREATE UNIQUE INDEX "LigneAmortissement_immobilisationId_exercice_key" ON "LigneAmortissement"("immobilisationId", "exercice");

-- AddForeignKey
ALTER TABLE "Immobilisation" ADD CONSTRAINT "Immobilisation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneAmortissement" ADD CONSTRAINT "LigneAmortissement_immobilisationId_fkey" FOREIGN KEY ("immobilisationId") REFERENCES "Immobilisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
