import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PRODUCTIVE_FAILURE mission template...');

  // Check if already exists
  const existing = await prisma.transfer_missions.findFirst({
    where: {
      type: 'PRODUCTIVE_FAILURE',
      scope_type: 'GLOBAL',
    },
  });

  if (existing) {
    console.log('✅ PRODUCTIVE_FAILURE mission already exists, skipping...');
    return;
  }

  // Create the mission
  const mission = await prisma.transfer_missions.create({
    data: {
      id: `pf_global_${Date.now()}`,
      type: 'PRODUCTIVE_FAILURE',
      scope_type: 'GLOBAL',
      family_id: null,
      institution_id: null,
      title: 'Productive Failure Challenge',
      description:
        'Attempt to solve this problem using your current understanding before receiving formal instruction.',
      prompt_template:
        'Read the problem carefully and write your best attempt at a solution. Focus on explaining your reasoning, even if you are unsure. Explain your thinking process step by step.',
      rubric_json: {
        passingScore: 50,
        maxScore: 100,
        criteria: [
          {
            name: 'Effort',
            description: 'Student demonstrates genuine attempt to engage with the problem',
            weight: 0.3,
          },
          {
            name: 'Reasoning',
            description: 'Student explains their thinking process',
            weight: 0.4,
          },
          {
            name: 'Completeness',
            description: 'Student addresses all parts of the problem',
            weight: 0.3,
          },
        ],
        feedback: {
          high: 'Excellent attempt! Your reasoning shows strong understanding.',
          medium: 'Good effort. Consider reviewing the key concepts.',
          low: 'Keep trying! Focus on understanding the main ideas first.',
        },
      },
      difficulty: 2,
      tags_json: ['productive-failure', 'pre-instruction'],
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  console.log(`✅ Created PRODUCTIVE_FAILURE mission: ${mission.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding PRODUCTIVE_FAILURE mission:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
