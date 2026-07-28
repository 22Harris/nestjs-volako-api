-- CreateTable
CREATE TABLE "JournalSequence" (
    "journalId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JournalSequence_pkey" PRIMARY KEY ("journalId","year")
);

-- AddForeignKey
ALTER TABLE "JournalSequence" ADD CONSTRAINT "JournalSequence_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
