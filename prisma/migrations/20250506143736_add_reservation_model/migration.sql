/*
  Warnings:

  - Added the required column `foodRequired` to the `Seating` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Seating" ADD COLUMN     "availablePackageIds" INTEGER[],
ADD COLUMN     "foodRequired" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "people" INTEGER NOT NULL,
    "seatingId" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "packageName" TEXT NOT NULL,
    "packageDescription" TEXT NOT NULL,
    "packagePrice" INTEGER NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_seatingId_fkey" FOREIGN KEY ("seatingId") REFERENCES "Seating"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
