-- CreateTable
CREATE TABLE "Relance" (
    "id" SERIAL NOT NULL,
    "factureId" INTEGER NOT NULL,
    "niveau" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Relance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Relance_userId_idx" ON "Relance"("userId");

-- CreateIndex
CREATE INDEX "Relance_factureId_idx" ON "Relance"("factureId");

-- AddForeignKey
ALTER TABLE "Relance" ADD CONSTRAINT "Relance_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relance" ADD CONSTRAINT "Relance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
