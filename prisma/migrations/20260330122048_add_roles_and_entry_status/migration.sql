-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DAF', 'CHEF_COMPTABLE', 'COMPTABLE', 'ASSISTANT', 'AUDITEUR');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('BROUILLON', 'VALIDE', 'VERROUILLE');

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "statut" "EntryStatus" NOT NULL DEFAULT 'BROUILLON';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'ASSISTANT';

-- CreateTable
CREATE TABLE "ReleveImport" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "soldeDebut" INTEGER,
    "soldeFin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ReleveImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneReleve" (
    "id" SERIAL NOT NULL,
    "releveId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "reference" TEXT,
    "rapprochee" BOOLEAN NOT NULL DEFAULT false,
    "journalLineId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LigneReleve_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReleveImport" ADD CONSTRAINT "ReleveImport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneReleve" ADD CONSTRAINT "LigneReleve_releveId_fkey" FOREIGN KEY ("releveId") REFERENCES "ReleveImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneReleve" ADD CONSTRAINT "LigneReleve_journalLineId_fkey" FOREIGN KEY ("journalLineId") REFERENCES "JournalLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
