-- CreateEnum
CREATE TYPE "CodeTva" AS ENUM ('NORMAL_20', 'INTERMEDIAIRE_10', 'REDUIT_5_5', 'PARTICULIER_2_1', 'EXONERE', 'HORS_CHAMP');

-- AlterTable
ALTER TABLE "JournalLine" ADD COLUMN     "codeTva" "CodeTva";
