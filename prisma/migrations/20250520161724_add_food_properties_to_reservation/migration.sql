-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "foodOptionDescription" TEXT,
ADD COLUMN     "foodOptionName" TEXT,
ADD COLUMN     "foodOptionPrice" INTEGER,
ADD COLUMN     "paymentReminderSent" TIMESTAMP(3);
