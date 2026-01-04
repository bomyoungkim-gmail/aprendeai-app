import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const log = await prisma.decision_logs.findFirst({
    orderBy: { created_at: 'desc' },
  });
  console.log(JSON.stringify(log, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
