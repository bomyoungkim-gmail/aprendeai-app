-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContentType" ADD VALUE 'VIDEO';
ALTER TYPE "ContentType" ADD VALUE 'AUDIO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'CLASS_ALERT_RAISED';
ALTER TYPE "EventType" ADD VALUE 'CLASS_POLICY_SET';
ALTER TYPE "EventType" ADD VALUE 'CLASS_WEEKLY_PLAN_CREATED';
ALTER TYPE "EventType" ADD VALUE 'FAMILY_POLICY_SET';
ALTER TYPE "EventType" ADD VALUE 'CO_SESSION_STARTED';
ALTER TYPE "EventType" ADD VALUE 'CO_SESSION_PHASE_CHANGED';
ALTER TYPE "EventType" ADD VALUE 'EDUCATOR_INTERVENTION_CHOSEN';
ALTER TYPE "EventType" ADD VALUE 'FAMILY_ALERT_RAISED';
ALTER TYPE "EventType" ADD VALUE 'CO_SESSION_FINISHED';

-- AlterTable
ALTER TABLE "contents" ADD COLUMN     "duration" INTEGER;

-- AlterTable
ALTER TABLE "session_events" ALTER COLUMN "reading_session_id" DROP NOT NULL;
