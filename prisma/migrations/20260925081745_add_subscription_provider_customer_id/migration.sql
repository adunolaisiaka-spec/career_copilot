-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "providerCustomerId" TEXT;

-- CreateIndex
CREATE INDEX "Subscription_providerCustomerId_idx" ON "Subscription"("providerCustomerId");
