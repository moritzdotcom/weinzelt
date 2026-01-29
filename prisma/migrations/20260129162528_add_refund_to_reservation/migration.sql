/*
  Warnings:

  - A unique constraint covering the columns `[stripeRefundId]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundedAmount" INTEGER,
ADD COLUMN     "stripeRefundId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_stripeRefundId_key" ON "Reservation"("stripeRefundId");
