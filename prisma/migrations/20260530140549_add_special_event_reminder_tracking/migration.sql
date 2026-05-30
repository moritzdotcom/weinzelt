-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "reminderAttemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reminderFailureReason" TEXT,
ADD COLUMN     "reminderLastAttemptAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "EventRegistration_specialEventId_reminderSent_idx" ON "EventRegistration"("specialEventId", "reminderSent");
