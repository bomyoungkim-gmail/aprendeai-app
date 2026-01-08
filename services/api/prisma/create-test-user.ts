import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating test user...');

  const hashedPassword = await bcrypt.hash('demo123', 10);

  const user = await prisma.users.upsert({
    where: { email: 'bom.kim@placestecnologia.com.br' },
    update: {},
    create: {
      email: 'bom.kim@placestecnologia.com.br',
      name: 'Bom Kim',
      password_hash: hashedPassword,
      last_context_role: 'STUDENT',
      schooling_level: 'SUPERIOR',
    },
  });

  console.log('✅ User created:', user.email);
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
