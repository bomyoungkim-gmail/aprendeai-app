import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting migration of user identities...");

  const users = await prisma.users.findMany();
  console.log(`Found ${users.length} users.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    // 1. Password Identity
    if (user.password_hash) {
      const email = user.email;
      // Check if exists
      const existing = await prisma.user_identities.findUnique({
        where: {
          provider_provider_id: {
            provider: "password",
            provider_id: email,
          },
        },
      });

      if (!existing) {
        await prisma.user_identities.create({
          data: {
            user_id: user.id,
            provider: "password",
            provider_id: email,
            email: email,
            password_hash: user.password_hash,
            updated_at: user.updated_at,
          },
        });
        migratedCount++;
      } else {
        skippedCount++;
      }
    }

    // 2. OAuth Identity
    if (user.oauth_provider && user.oauth_id) {
      const existing = await prisma.user_identities.findUnique({
        where: {
          provider_provider_id: {
            provider: user.oauth_provider,
            provider_id: user.oauth_id,
          },
        },
      });

      if (!existing) {
        await prisma.user_identities.create({
          data: {
            user_id: user.id,
            provider: user.oauth_provider,
            provider_id: user.oauth_id,
            email: user.email,
            metadata: user.oauth_picture
              ? { picture: user.oauth_picture }
              : undefined,
            updated_at: user.updated_at,
          },
        });
        migratedCount++;
      } else {
        skippedCount++;
      }
    }
  }

  console.log(
    `Migration finished. Migrated (identities created): ${migratedCount}, Skipped: ${skippedCount}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
