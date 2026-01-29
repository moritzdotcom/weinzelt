/*
  Warnings:

  - You are about to drop the column `foodCountFish` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `foodCountMeat` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `foodCountVegetarian` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `packageDescription` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `packageName` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `packagePrice` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `paymentReminderSent` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `totalFoodPrice` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `availablePackageIds` on the `Seating` table. All the data in the column will be lost.
  - You are about to drop the column `foodRequired` on the `Seating` table. All the data in the column will be lost.
  - You are about to drop the column `minimumSpend` on the `Seating` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "foodCountFish",
DROP COLUMN "foodCountMeat",
DROP COLUMN "foodCountVegetarian",
DROP COLUMN "packageDescription",
DROP COLUMN "packageName",
DROP COLUMN "packagePrice",
DROP COLUMN "paymentReminderSent",
DROP COLUMN "totalFoodPrice",
ADD COLUMN     "glassDepositPrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minimumSpend" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Seating" DROP COLUMN "availablePackageIds",
DROP COLUMN "foodRequired",
DROP COLUMN "minimumSpend";
