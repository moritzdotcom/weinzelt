-- CreateTable
CREATE TABLE "ReservationInvoice" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "subtotalCents" INTEGER NOT NULL,
    "vat7Cents" INTEGER NOT NULL DEFAULT 0,
    "vat19Cents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "lineItems" JSONB NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "billingAddress" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceSequence" (
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceSequence_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReservationInvoice_reservationId_key" ON "ReservationInvoice"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationInvoice_invoiceNumber_key" ON "ReservationInvoice"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "ReservationInvoice" ADD CONSTRAINT "ReservationInvoice_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
