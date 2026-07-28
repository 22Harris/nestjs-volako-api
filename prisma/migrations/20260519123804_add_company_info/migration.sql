-- CreateTable
CREATE TABLE "CompanyInfo" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "siret" TEXT,
    "numTva" TEXT,
    "adresse" TEXT,
    "email" TEXT,
    "iban" TEXT,

    CONSTRAINT "CompanyInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInfo_userId_key" ON "CompanyInfo"("userId");

-- AddForeignKey
ALTER TABLE "CompanyInfo" ADD CONSTRAINT "CompanyInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
