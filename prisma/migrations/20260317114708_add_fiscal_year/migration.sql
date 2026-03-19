-- CreateEnum
CREATE TYPE "FiscalYearStatus" AS ENUM ('OUVERT', 'CLOTURE');

-- CreateTable
CREATE TABLE "FiscalYear" (
    "id" SERIAL NOT NULL,
    "annee" INTEGER NOT NULL,
    "statut" "FiscalYearStatus" NOT NULL DEFAULT 'OUVERT',
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_annee_userId_key" ON "FiscalYear"("annee", "userId");

-- AddForeignKey
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
