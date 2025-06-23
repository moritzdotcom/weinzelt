-- AlterTable
ALTER TABLE "Seating" ADD COLUMN     "minimumSpendStanding" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minimumSpendVip" INTEGER NOT NULL DEFAULT 0;
