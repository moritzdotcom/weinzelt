/*
  Warnings:

  - You are about to drop the `Package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EventToPackage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_EventToPackage" DROP CONSTRAINT "_EventToPackage_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventToPackage" DROP CONSTRAINT "_EventToPackage_B_fkey";

-- DropTable
DROP TABLE "Package";

-- DropTable
DROP TABLE "_EventToPackage";
