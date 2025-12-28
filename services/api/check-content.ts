
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const content = await prisma.content.findUnique({
    where: { id: '86364e39-a5b8-45dc-a60a-b4bafa9b535d' },
    include: { file: true }
  });
  console.log(JSON.stringify(content, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
