import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a test institution
  const institution = await prisma.institution.upsert({
    where: { id: 'seed-institution-1' },
    update: {},
    create: {
      id: 'seed-institution-1',
      name: 'Escola Demo AprendeAI',
      type: 'SCHOOL',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
    },
  });
  console.log('✅ Institution created:', institution.name);

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const student = await prisma.user.upsert({
    where: { email: 'aluno@demo.com' },
    update: {},
    create: {
      email: 'aluno@demo.com',
      name: 'Aluno Demo',
      passwordHash: hashedPassword,
      role: 'STUDENT',
      schoolingLevel: '9_EF',
      age: 15,
      institutionId: institution.id,
    },
  });
  console.log('✅ Student created:', student.email);

  const teacher = await prisma.user.upsert({
    where: { email: 'professor@demo.com' },
    update: {},
    create: {
      email: 'professor@demo.com',
      name: 'Professor Demo',
      passwordHash: hashedPassword,
      role: 'TEACHER',
      schoolingLevel: 'SUPERIOR',
      institutionId: institution.id,
    },
  });
  console.log('✅ Teacher created:', teacher.email);

  // Create sample content
  const content = await prisma.content.create({
    data: {
      title: 'Introdução à Inteligência Artificial',
      type: 'SCHOOL_MATERIAL',
      originalLanguage: 'PT_BR',
      rawText: `A Inteligência Artificial (IA) é um ramo da ciência da computação que se dedica ao desenvolvimento de sistemas capazes de realizar tarefas que normalmente exigem inteligência humana. 
      
Essas tarefas incluem reconhecimento de voz, tomada de decisões, tradução de idiomas e reconhecimento visual. A IA está presente em muitos aspectos do nosso cotidiano, desde assistentes virtuais como Siri e Alexa até sistemas de recomendação da Netflix e Spotify.

Existem diferentes tipos de IA: a IA fraca, que é projetada para realizar uma tarefa específica, e a IA forte, que teria a capacidade de entender e aprender qualquer tarefa intelectual que um ser humano pode fazer.`,
      institutionId: institution.id,
      createdBy: teacher.id,
    },
  });
  console.log('✅ Content created:', content.title);

  // Create daily goal for student
  await prisma.dailyGoal.create({
    data: {
      userId: student.id,
      goalType: 'MINUTES',
      goalValue: 20,
    },
  });
  console.log('✅ Daily goal created for student');

  // Create streak record
  await prisma.streak.create({
    data: {
      userId: student.id,
      currentStreak: 3,
      bestStreak: 5,
      freezeTokens: 1,
      lastGoalMetDate: new Date(),
    },
  });
  console.log('✅ Streak record created');

  console.log('🎉 Seed completed!');
  console.log('\n📝 Test credentials:');
  console.log('   Student: aluno@demo.com / password123');
  console.log('   Teacher: professor@demo.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
