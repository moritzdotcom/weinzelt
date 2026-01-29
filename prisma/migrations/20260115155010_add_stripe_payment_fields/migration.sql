/*
  Warnings:

  - A unique constraint covering the columns `[stripeCheckoutSessionId]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ReservationPaymentStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PAID', 'CANCELED');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "ReservationPaymentStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_stripeCheckoutSessionId_key" ON "Reservation"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_stripePaymentIntentId_key" ON "Reservation"("stripePaymentIntentId");
