-- CreateTable
CREATE TABLE "ReservationReminder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reminderSent" TIMESTAMP(3),

    CONSTRAINT "ReservationReminder_pkey" PRIMARY KEY ("id")
);
