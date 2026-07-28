-- CreateTable
CREATE TABLE "CentreAnalytique" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "CentreAnalytique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneAnalytique" (
    "id" SERIAL NOT NULL,
    "journalLineId" INTEGER NOT NULL,
    "centreId" INTEGER NOT NULL,
    "pourcentage" INTEGER NOT NULL,

    CONSTRAINT "LigneAnalytique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CentreAnalytique_userId_idx" ON "CentreAnalytique"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CentreAnalytique_code_userId_key" ON "CentreAnalytique"("code", "userId");

-- CreateIndex
CREATE INDEX "LigneAnalytique_centreId_idx" ON "LigneAnalytique"("centreId");

-- CreateIndex
CREATE UNIQUE INDEX "LigneAnalytique_journalLineId_centreId_key" ON "LigneAnalytique"("journalLineId", "centreId");

-- AddForeignKey
ALTER TABLE "CentreAnalytique" ADD CONSTRAINT "CentreAnalytique_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneAnalytique" ADD CONSTRAINT "LigneAnalytique_journalLineId_fkey" FOREIGN KEY ("journalLineId") REFERENCES "JournalLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneAnalytique" ADD CONSTRAINT "LigneAnalytique_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "CentreAnalytique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
