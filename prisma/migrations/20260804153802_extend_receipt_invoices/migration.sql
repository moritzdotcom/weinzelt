-- CreateEnum
CREATE TYPE "ReceiptInvoiceCaseType" AS ENUM ('SINGLE', 'COLLECTION', 'SPLIT');

-- DropForeignKey
ALTER TABLE "ReceiptInvoiceSupplement" DROP CONSTRAINT "ReceiptInvoiceSupplement_reservationId_fkey";

-- DropIndex
DROP INDEX "ReceiptInvoiceSupplement_receiptNumber_receiptDate_key";

-- AlterTable
ALTER TABLE "ReceiptInvoiceSupplement" ADD COLUMN     "allocations" JSONB,
ADD COLUMN     "caseId" TEXT,
ADD COLUMN     "subtotalCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tipCents" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "reservationId" DROP NOT NULL,
ALTER COLUMN "receiptNumber" DROP NOT NULL,
ALTER COLUMN "receiptDate" DROP NOT NULL,
ALTER COLUMN "receiptCreatedAtLabel" DROP NOT NULL,
ALTER COLUMN "originalPdfPath" DROP NOT NULL,
ALTER COLUMN "originalPdfSha256" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ReceiptInvoiceCase" (
    "id" TEXT NOT NULL,
    "type" "ReceiptInvoiceCaseType" NOT NULL,
    "reservationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptInvoiceCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptInvoiceSourceReceipt" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "tableNumber" TEXT,
    "receiptCreatedAtLabel" TEXT NOT NULL,
    "receiptPaidAtLabel" TEXT,
    "netCents" INTEGER NOT NULL,
    "vatCents" INTEGER NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "tipCents" INTEGER NOT NULL,
    "grossCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "taxLines" JSONB NOT NULL,
    "payments" JSONB NOT NULL,
    "originalPdfPath" TEXT NOT NULL,
    "originalPdfSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptInvoiceSourceReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReceiptInvoiceCase_reservationId_idx" ON "ReceiptInvoiceCase"("reservationId");

-- CreateIndex
CREATE INDEX "ReceiptInvoiceCase_createdAt_idx" ON "ReceiptInvoiceCase"("createdAt");

-- CreateIndex
CREATE INDEX "ReceiptInvoiceSourceReceipt_caseId_idx" ON "ReceiptInvoiceSourceReceipt"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptInvoiceSourceReceipt_receiptNumber_receiptDate_key" ON "ReceiptInvoiceSourceReceipt"("receiptNumber", "receiptDate");

-- CreateIndex
CREATE INDEX "ReceiptInvoiceSupplement_caseId_idx" ON "ReceiptInvoiceSupplement"("caseId");

-- CreateIndex
CREATE INDEX "ReceiptInvoiceSupplement_receiptNumber_receiptDate_idx" ON "ReceiptInvoiceSupplement"("receiptNumber", "receiptDate");

-- AddForeignKey
ALTER TABLE "ReceiptInvoiceCase" ADD CONSTRAINT "ReceiptInvoiceCase_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptInvoiceSourceReceipt" ADD CONSTRAINT "ReceiptInvoiceSourceReceipt_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ReceiptInvoiceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptInvoiceSupplement" ADD CONSTRAINT "ReceiptInvoiceSupplement_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ReceiptInvoiceCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptInvoiceSupplement" ADD CONSTRAINT "ReceiptInvoiceSupplement_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
