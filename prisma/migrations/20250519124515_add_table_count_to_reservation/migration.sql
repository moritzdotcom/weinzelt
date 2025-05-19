-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "payed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tableCount" INTEGER NOT NULL DEFAULT 1;
