-- CreateTable
CREATE TABLE "CompteBank" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "derniereSync" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompteBank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompteBank_userId_idx" ON "CompteBank"("userId");

-- AddForeignKey
ALTER TABLE "CompteBank" ADD CONSTRAINT "CompteBank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
