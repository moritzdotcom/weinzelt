-- CreateTable
CREATE TABLE "ReceiptInvoiceSupplement" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "tableNumber" TEXT,
    "receiptCreatedAtLabel" TEXT NOT NULL,
    "receiptPaidAtLabel" TEXT,
    "netCents" INTEGER NOT NULL,
    "vatCents" INTEGER NOT NULL,
    "grossCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "recipientCompany" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientAddress" JSONB NOT NULL,
    "taxLines" JSONB NOT NULL,
    "payments" JSONB NOT NULL,
    "originalPdfPath" TEXT NOT NULL,
    "finalPdfPath" TEXT NOT NULL,
    "originalPdfSha256" TEXT NOT NULL,
    "finalPdfSha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptInvoiceSupplement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptInvoiceSupplement_documentNumber_key" ON "ReceiptInvoiceSupplement"("documentNumber");

-- CreateIndex
CREATE INDEX "ReceiptInvoiceSupplement_reservationId_idx" ON "ReceiptInvoiceSupplement"("reservationId");

-- CreateIndex
CREATE INDEX "ReceiptInvoiceSupplement_createdAt_idx" ON "ReceiptInvoiceSupplement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptInvoiceSupplement_receiptNumber_receiptDate_key" ON "ReceiptInvoiceSupplement"("receiptNumber", "receiptDate");

-- AddForeignKey
ALTER TABLE "ReceiptInvoiceSupplement" ADD CONSTRAINT "ReceiptInvoiceSupplement_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
