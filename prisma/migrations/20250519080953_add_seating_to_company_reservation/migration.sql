/*
  Warnings:

  - You are about to drop the column `date` on the `CompanyReservation` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `CompanyReservation` table. All the data in the column will be lost.
  - You are about to drop the column `timeslot` on the `CompanyReservation` table. All the data in the column will be lost.
  - Added the required column `seatingId` to the `CompanyReservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CompanyReservation" DROP CONSTRAINT "CompanyReservation_eventId_fkey";

-- AlterTable
ALTER TABLE "CompanyReservation" DROP COLUMN "date",
DROP COLUMN "eventId",
DROP COLUMN "timeslot",
ADD COLUMN     "seatingId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "CompanyReservation" ADD CONSTRAINT "CompanyReservation_seatingId_fkey" FOREIGN KEY ("seatingId") REFERENCES "Seating"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
