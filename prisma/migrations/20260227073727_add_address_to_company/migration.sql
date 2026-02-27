-- AlterTable
ALTER TABLE "CompanyReservation" ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "shippingAddress" JSONB,
ADD COLUMN     "shippingSameAsBilling" BOOLEAN NOT NULL DEFAULT true;
