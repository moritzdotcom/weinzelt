-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "shippingAddress" JSONB,
ADD COLUMN     "shippingSameAsBilling" BOOLEAN NOT NULL DEFAULT true;
