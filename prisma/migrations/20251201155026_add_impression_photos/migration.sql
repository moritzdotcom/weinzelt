-- CreateTable
CREATE TABLE "ImpressionPhoto" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "day" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpressionPhoto_pkey" PRIMARY KEY ("id")
);
