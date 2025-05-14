-- CreateTable
CREATE TABLE "InviteQuota" (
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitesLeft" INTEGER NOT NULL,

    CONSTRAINT "InviteQuota_pkey" PRIMARY KEY ("eventId","userId")
);

-- AddForeignKey
ALTER TABLE "InviteQuota" ADD CONSTRAINT "InviteQuota_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteQuota" ADD CONSTRAINT "InviteQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
