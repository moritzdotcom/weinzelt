-- AlterTable
ALTER TABLE "CompanyReservation" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "CompanyReservation" ADD CONSTRAINT "CompanyReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
