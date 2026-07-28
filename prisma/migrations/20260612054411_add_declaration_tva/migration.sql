-- CreateEnum
CREATE TYPE "StatutDeclaration" AS ENUM ('BROUILLON', 'SOUMISE', 'VALIDEE');

-- CreateTable
CREATE TABLE "DeclarationTva" (
    "id" SERIAL NOT NULL,
    "periode" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateSoumission" TIMESTAMP(3),
    "statut" "StatutDeclaration" NOT NULL DEFAULT 'BROUILLON',
    "tvaAPayer" INTEGER NOT NULL,
    "creditTva" INTEGER NOT NULL,
    "donnees" JSONB NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "DeclarationTva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeclarationTva_userId_idx" ON "DeclarationTva"("userId");

-- CreateIndex
CREATE INDEX "DeclarationTva_userId_dateDebut_idx" ON "DeclarationTva"("userId", "dateDebut");

-- AddForeignKey
ALTER TABLE "DeclarationTva" ADD CONSTRAINT "DeclarationTva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
