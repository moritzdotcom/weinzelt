/*
  Warnings:

  - You are about to drop the column `foodOptionDescription` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `foodOptionName` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `foodOptionPrice` on the `Reservation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "foodOptionDescription",
DROP COLUMN "foodOptionName",
DROP COLUMN "foodOptionPrice",
ADD COLUMN     "foodCountFish" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "foodCountMeat" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "foodCountVegetarian" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalFoodPrice" INTEGER NOT NULL DEFAULT 0;
