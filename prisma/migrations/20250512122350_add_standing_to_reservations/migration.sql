/*
  Warnings:

  - You are about to drop the column `available` on the `Seating` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('VIP', 'STANDING');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "type" "ReservationType" NOT NULL DEFAULT 'VIP';

-- AlterTable
ALTER TABLE "Seating" DROP COLUMN "available",
ADD COLUMN     "availableStanding" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "availableVip" INTEGER NOT NULL DEFAULT 10;
