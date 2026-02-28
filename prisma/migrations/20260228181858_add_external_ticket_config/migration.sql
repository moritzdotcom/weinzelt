-- CreateTable
CREATE TABLE "ExternalTicketConfig" (
    "id" TEXT NOT NULL,
    "seatingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ticketPrice" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "ticketPerPerson" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalTicketConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalTicketConfig_seatingId_key" ON "ExternalTicketConfig"("seatingId");

-- AddForeignKey
ALTER TABLE "ExternalTicketConfig" ADD CONSTRAINT "ExternalTicketConfig_seatingId_fkey" FOREIGN KEY ("seatingId") REFERENCES "Seating"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
