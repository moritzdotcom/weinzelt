-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "current" BOOLEAN NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDate" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "dow" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "EventDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seating" (
    "id" TEXT NOT NULL,
    "eventDateId" TEXT NOT NULL,
    "timeslot" TEXT NOT NULL,
    "available" INTEGER NOT NULL,

    CONSTRAINT "Seating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "strikePrice" INTEGER,
    "image" TEXT NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EventToPackage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventToPackage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EventToPackage_B_index" ON "_EventToPackage"("B");

-- AddForeignKey
ALTER TABLE "EventDate" ADD CONSTRAINT "EventDate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seating" ADD CONSTRAINT "Seating_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "EventDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventToPackage" ADD CONSTRAINT "_EventToPackage_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventToPackage" ADD CONSTRAINT "_EventToPackage_B_fkey" FOREIGN KEY ("B") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
