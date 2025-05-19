-- CreateTable
CREATE TABLE "CompanyReservation" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "timeslot" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "people" INTEGER NOT NULL,
    "budget" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "CompanyReservation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CompanyReservation" ADD CONSTRAINT "CompanyReservation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
