-- CreateEnum
CREATE TYPE "TypeDemande" AS ENUM ('ACCES', 'EFFACEMENT', 'PORTABILITE', 'RECTIFICATION');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('EN_ATTENTE', 'TRAITEE', 'REFUSEE');

-- CreateTable
CREATE TABLE "DemandeRgpd" (
    "id" SERIAL NOT NULL,
    "type" "TypeDemande" NOT NULL,
    "statut" "StatutDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateTraitement" TIMESTAMP(3),
    "note" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "DemandeRgpd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandeRgpd_userId_idx" ON "DemandeRgpd"("userId");

-- AddForeignKey
ALTER TABLE "DemandeRgpd" ADD CONSTRAINT "DemandeRgpd_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
