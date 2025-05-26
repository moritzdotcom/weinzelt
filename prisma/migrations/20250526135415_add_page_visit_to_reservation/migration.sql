-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "pageVisitId" TEXT;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_pageVisitId_fkey" FOREIGN KEY ("pageVisitId") REFERENCES "PageVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
