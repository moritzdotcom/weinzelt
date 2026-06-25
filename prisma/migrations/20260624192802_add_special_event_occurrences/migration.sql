-- DropForeignKey
ALTER TABLE "SpecialEvent" DROP CONSTRAINT "SpecialEvent_eventDateId_fkey";

-- DropIndex
DROP INDEX "EventRegistration_specialEventId_email_key";

-- DropIndex
DROP INDEX "EventRegistration_specialEventId_reminderSent_idx";

-- DropIndex
DROP INDEX "EventRegistration_specialEventId_status_idx";

-- DropIndex
DROP INDEX "EventRegistration_stripeCheckoutSessionId_idx";

-- DropIndex
DROP INDEX "EventRegistration_stripeCheckoutSessionId_key";

-- DropIndex
DROP INDEX "SpecialEvent_eventDateId_sortOrder_idx";

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "specialEventOccurrenceId" TEXT;

-- AlterTable
ALTER TABLE "SpecialEvent" ALTER COLUMN "eventDateId" DROP NOT NULL,
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SpecialEventOccurrence" (
    "id" TEXT NOT NULL,
    "specialEventId" TEXT NOT NULL,
    "eventDateId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "capacity" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SpecialEventOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpecialEventOccurrence_specialEventId_sortOrder_idx" ON "SpecialEventOccurrence"("specialEventId", "sortOrder");

-- CreateIndex
CREATE INDEX "SpecialEventOccurrence_eventDateId_idx" ON "SpecialEventOccurrence"("eventDateId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialEventOccurrence_specialEventId_eventDateId_key" ON "SpecialEventOccurrence"("specialEventId", "eventDateId");

-- CreateIndex
CREATE INDEX "EventRegistration_specialEventId_idx" ON "EventRegistration"("specialEventId");

-- CreateIndex
CREATE INDEX "EventRegistration_specialEventOccurrenceId_idx" ON "EventRegistration"("specialEventOccurrenceId");

-- CreateIndex
CREATE INDEX "EventRegistration_email_idx" ON "EventRegistration"("email");

-- CreateIndex
CREATE INDEX "SpecialEvent_sortOrder_idx" ON "SpecialEvent"("sortOrder");

-- AddForeignKey
ALTER TABLE "SpecialEvent" ADD CONSTRAINT "SpecialEvent_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "EventDate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialEventOccurrence" ADD CONSTRAINT "SpecialEventOccurrence_specialEventId_fkey" FOREIGN KEY ("specialEventId") REFERENCES "SpecialEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialEventOccurrence" ADD CONSTRAINT "SpecialEventOccurrence_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "EventDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_specialEventOccurrenceId_fkey" FOREIGN KEY ("specialEventOccurrenceId") REFERENCES "SpecialEventOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
