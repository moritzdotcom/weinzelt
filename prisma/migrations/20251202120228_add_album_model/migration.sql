/*
  Warnings:

  - You are about to drop the column `day` on the `ImpressionPhoto` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `ImpressionPhoto` table. All the data in the column will be lost.
  - Added the required column `albumId` to the `ImpressionPhoto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ImpressionPhoto" DROP COLUMN "day",
DROP COLUMN "year",
ADD COLUMN     "albumId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "day" TEXT NOT NULL,
    "coverPhotoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Album_year_day_key" ON "Album"("year", "day");

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "ImpressionPhoto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpressionPhoto" ADD CONSTRAINT "ImpressionPhoto_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
