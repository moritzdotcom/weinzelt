/*
  Warnings:

  - You are about to drop the column `confirmed` on the `Reservation` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ConfirmationState" AS ENUM ('REQUESTED', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "confirmed",
ADD COLUMN     "confirmationState" "ConfirmationState" NOT NULL DEFAULT 'REQUESTED';
