-- SUBFASE 2.3: Add scope fields to EntitlementSnapshot
ALTER TABLE "entitlement_snapshots"
ADD COLUMN "scope_type" TEXT;

ALTER TABLE "entitlement_snapshots"
ADD COLUMN "scope_id" TEXT;