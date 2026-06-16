/*
  Warnings:

  - A unique constraint covering the columns `[stripeCheckoutSessionId]` on the table `EventRegistration` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "EventRegistrationStatus" ADD VALUE 'PENDING_PAYMENT';

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentExpiresAt" TIMESTAMP(3),
ADD COLUMN     "priceCentsTotal" INTEGER,
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_stripeCheckoutSessionId_key" ON "EventRegistration"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "EventRegistration_stripeCheckoutSessionId_idx" ON "EventRegistration"("stripeCheckoutSessionId");
