-- Script 2/8 - SQL Verification Queries
-- Run these in your PostgreSQL console to verify the migration

-- 1) Verify Users table columns (system_role, context_role should exist)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name='users' 
AND column_name IN ('system_role', 'context_role', 'institution_id', 'role');

-- 2) Verify Family members learning_role column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name='family_members' 
AND column_name='learning_role';

-- 3) Verify Entitlement snapshots scope columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name='entitlement_snapshots' 
AND column_name IN ('scope_type', 'scope_id');

-- 4) Verify unique constraint on entitlement_snapshots
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name='entitlement_snapshots'
AND constraint_type='UNIQUE';

-- 5) Verify institution_members role type and unique constraint
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name='institution_members' 
AND column_name='role';

SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name='institution_members'
AND constraint_type='UNIQUE';

-- 6) Verify new enums exist
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'EntitlementScopeType'::regtype
ORDER BY enumsortorder;

SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'FamilyLearningRole'::regtype
ORDER BY enumsortorder;

SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'FamilyRole'::regtype
ORDER BY enumsortorder;

-- 7) Verify existing tables (these should already exist from before)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public' 
AND table_name IN (
  'content_shares',
  'annotation_shares', 
  'comment_threads',
  'comments',
  'teacher_verifications',
  'institution_policies'
)
ORDER BY table_name;
