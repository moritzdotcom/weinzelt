/*
  Warnings:

  - A unique constraint covering the columns `[unsubscribeToken]` on the table `NewsletterSubscription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT');

-- CreateEnum
CREATE TYPE "NewsletterRecipientStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "NewsletterSubscription" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "unsubscribeToken" TEXT,
ADD COLUMN     "unsubscribedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "status" "NewsletterStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterRecipient" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "unsubscribeToken" TEXT NOT NULL,
    "status" "NewsletterRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "claimToken" TEXT,
    "sendingAt" TIMESTAMP(3),
    "trackingToken" TEXT NOT NULL,
    "ctaClickedAt" TIMESTAMP(3),
    "ctaClickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterClick" (
    "id" TEXT NOT NULL,
    "newsletterRecipientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Newsletter_createdAt_idx" ON "Newsletter"("createdAt");

-- CreateIndex
CREATE INDEX "Newsletter_status_idx" ON "Newsletter"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterRecipient_trackingToken_key" ON "NewsletterRecipient"("trackingToken");

-- CreateIndex
CREATE INDEX "NewsletterRecipient_newsletterId_status_attemptCount_idx" ON "NewsletterRecipient"("newsletterId", "status", "attemptCount");

-- CreateIndex
CREATE INDEX "NewsletterRecipient_newsletterId_createdAt_idx" ON "NewsletterRecipient"("newsletterId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterRecipient_newsletterId_email_key" ON "NewsletterRecipient"("newsletterId", "email");

-- CreateIndex
CREATE INDEX "NewsletterClick_newsletterRecipientId_createdAt_idx" ON "NewsletterClick"("newsletterRecipientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_unsubscribeToken_key" ON "NewsletterSubscription"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_confirmed_unsubscribedAt_idx" ON "NewsletterSubscription"("confirmed", "unsubscribedAt");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_createdAt_idx" ON "NewsletterSubscription"("createdAt");

-- AddForeignKey
ALTER TABLE "NewsletterRecipient" ADD CONSTRAINT "NewsletterRecipient_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "Newsletter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterRecipient" ADD CONSTRAINT "NewsletterRecipient_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "NewsletterSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterClick" ADD CONSTRAINT "NewsletterClick_newsletterRecipientId_fkey" FOREIGN KEY ("newsletterRecipientId") REFERENCES "NewsletterRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
