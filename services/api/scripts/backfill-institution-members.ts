import { PrismaClient, ContextRole, InstitutionRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: Backfill Institution Members...');

  // 1. Get all users who have a last_institution_id
  const users = await prisma.users.findMany({
    where: {
      last_institution_id: { not: null },
    },
    select: {
      id: true,
      email: true,
      last_institution_id: true,
      last_context_role: true,
    },
  });

  console.log(`Found ${users.length} users with a last_institution_id.`);

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const user of users) {
    if (!user.last_institution_id) continue;

    try {
      // 2. Check if membership already exists using findFirst (safer than guessing unique key name)
      const existingMember = await prisma.institution_members.findFirst({
        where: {
          institution_id: user.last_institution_id,
          user_id: user.id,
        },
      });

      if (existingMember) {
        skippedCount++;
        continue;
      }

      // 3. Determine role mapping
      // Map ContextRole to InstitutionRole
      let role: InstitutionRole = 'STUDENT'; // Default fallback
      
      switch (user.last_context_role) {
        case 'INSTITUTION_EDUCATION_ADMIN':
          role = 'INSTITUTION_EDUCATION_ADMIN';
          break;
        case 'INSTITUTION_ENTERPRISE_ADMIN':
          role = 'INSTITUTION_ENTERPRISE_ADMIN';
          break;
        case 'TEACHER':
          role = 'TEACHER';
          break;
        case 'STUDENT':
          role = 'STUDENT';
          break;
        case 'EMPLOYEE':
          role = 'EMPLOYEE';
          break;
        case 'OWNER':
           role = 'INSTITUTION_EDUCATION_ADMIN'; // Map OWNER to ADMIN as InstitutionRole lacks OWNER
           break;
        default:
           role = 'STUDENT';
      }

      // 4. Create Member
      await prisma.institution_members.create({
        data: {
          id: crypto.randomUUID(),
          institution_id: user.last_institution_id,
          user_id: user.id,
          role: role,
          status: 'ACTIVE',
        },
      });

      createdCount++;
      console.log(`Created member for user ${user.email} -> Inst ${user.last_institution_id} (${role})`);

    } catch (e) {
      console.error(`Error processing user ${user.email}:`, e);
      errorCount++;
    }
  }

  console.log('Migration finished.');
  console.log(`Created: ${createdCount}`);
  console.log(`Skipped (Already Exists): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
