/*
  Warnings:

  - A unique constraint covering the columns `[provider_subscription_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'INDIVIDUAL_PREMIUM', 'FAMILY', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "OrgUserStatus" AS ENUM ('PROVISIONED', 'ACTIVE_LICENSED', 'SUSPENDED', 'DEPROVISIONED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'MANUAL_INVOICE', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'GRACE_PERIOD';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "billing_period" "BillingPeriod",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN     "price_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seat_price_cents" INTEGER,
ADD COLUMN     "type" "PlanType" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "canceled_at" TIMESTAMP(3),
ADD COLUMN     "ended_at" TIMESTAMP(3),
ADD COLUMN     "family_id" TEXT,
ADD COLUMN     "grace_until" TIMESTAMP(3),
ADD COLUMN     "institution_id" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "provider" "PaymentProvider",
ADD COLUMN     "user_id" TEXT;

-- CreateTable
CREATE TABLE "entitlement_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "plan_type" "PlanType" NOT NULL,
    "limits" JSONB NOT NULL,
    "features" JSONB NOT NULL DEFAULT '{}',
    "effective_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entitlement_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_subscription_policies" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "baseline_seats" INTEGER NOT NULL DEFAULT 0,
    "allow_overage" BOOLEAN NOT NULL DEFAULT true,
    "grace_days" INTEGER NOT NULL DEFAULT 30,
    "true_up_day_of_month" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_subscription_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_allocation_events" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seat_allocation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entitlement_snapshots_user_id_key" ON "entitlement_snapshots"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "org_subscription_policies_institution_id_key" ON "org_subscription_policies"("institution_id");

-- CreateIndex
CREATE INDEX "seat_allocation_events_institution_id_created_at_idx" ON "seat_allocation_events"("institution_id", "created_at");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_family_id_idx" ON "subscriptions"("family_id");

-- CreateIndex
CREATE INDEX "subscriptions_institution_id_idx" ON "subscriptions"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_provider_subscription_id_key" ON "subscriptions"("provider_subscription_id");

-- AddForeignKey
ALTER TABLE "entitlement_snapshots" ADD CONSTRAINT "entitlement_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_subscription_policies" ADD CONSTRAINT "org_subscription_policies_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
