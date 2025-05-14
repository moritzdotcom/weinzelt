/*
  Warnings:

  - You are about to drop the `InviteQuota` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InviteQuota" DROP CONSTRAINT "InviteQuota_eventId_fkey";

-- DropForeignKey
ALTER TABLE "InviteQuota" DROP CONSTRAINT "InviteQuota_userId_fkey";

-- DropTable
DROP TABLE "InviteQuota";
