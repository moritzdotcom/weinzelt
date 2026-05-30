/*
  Warnings:

  - A unique constraint covering the columns `[specialEventId,email]` on the table `EventRegistration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SpecialEventCategory" AS ENUM ('WINE_WALK', 'WINE_TASTING', 'OTHER');

-- CreateEnum
CREATE TYPE "SpecialEventBookingType" AS ENUM ('INTERNAL_REGISTRATION', 'EXTERNAL_LINK', 'NONE');

-- CreateEnum
CREATE TYPE "EventRegistrationStatus" AS ENUM ('REGISTERED', 'CANCELED');

-- DropForeignKey
ALTER TABLE "EventRegistration" DROP CONSTRAINT "EventRegistration_specialEventId_fkey";

-- DropForeignKey
ALTER TABLE "SpecialEvent" DROP CONSTRAINT "SpecialEvent_eventDateId_fkey";

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" "EventRegistrationStatus" NOT NULL DEFAULT 'REGISTERED';

-- AlterTable
ALTER TABLE "SpecialEvent" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "bookingType" "SpecialEventBookingType" NOT NULL DEFAULT 'INTERNAL_REGISTRATION',
ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "category" "SpecialEventCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ctaLabel" TEXT NOT NULL DEFAULT 'Jetzt anmelden',
ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxPersonsPerRegistration" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "priceCents" INTEGER,
ADD COLUMN     "priceLabel" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "titleImagePath" TEXT;

-- CreateIndex
CREATE INDEX "EventRegistration_specialEventId_status_idx" ON "EventRegistration"("specialEventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_specialEventId_email_key" ON "EventRegistration"("specialEventId", "email");

-- CreateIndex
CREATE INDEX "SpecialEvent_eventDateId_sortOrder_idx" ON "SpecialEvent"("eventDateId", "sortOrder");

-- CreateIndex
CREATE INDEX "SpecialEvent_isPublished_idx" ON "SpecialEvent"("isPublished");

-- AddForeignKey
ALTER TABLE "SpecialEvent" ADD CONSTRAINT "SpecialEvent_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "EventDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_specialEventId_fkey" FOREIGN KEY ("specialEventId") REFERENCES "SpecialEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
