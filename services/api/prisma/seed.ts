import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Simple user creation without bcrypt (will use auth service later)
  const student = await prisma.user.upsert({
    where: { email: 'aluno@demo.com' },
    update: {},
    create: {
      email: 'aluno@demo.com',
      name: 'Aluno Demo',
      passwordHash: '$2b$10$YourHashedPasswordHere', // Placeholder - use real hash in production
      role: 'STUDENT',
      schoolingLevel: '9_EF',
      age: 15,
    },
  });

  console.log('✅ Student created:', student.email);

  // Create sample content
  const content = await prisma.content.create({
    data: {
      title: 'Introdução à Inteligência Artificial',
      type: 'SCHOOL_MATERIAL',
      originalLanguage: 'PT_BR',
      rawText: `A Inteligência Artificial (IA) é um campo da ciência da computação focado em criar sistemas que podem realizar tarefas que normalmente exigem inteligência humana.`,
      createdBy: student.id,
    },
  });

  console.log('✅ Content created:', content.title);

  console.log('🎉 Seed completed!');
  console.log('\n📝 To create a real user, use POST /auth/register');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
