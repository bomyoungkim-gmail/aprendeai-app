import { PrismaClient, ConfigType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLLMConfigs() {
  console.log('🌱 Seeding LLM Model Configurations...');

  const configs = [
    {
      key: 'llm.openai.model',
      value: 'gpt-4',
      type: ConfigType.STRING,
      category: 'llm',
      description: 'Default OpenAI model for text generation',
      environment: null, // Global config
      metadata: {
        alternatives: ['gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o'],
        costTier: 'premium',
      },
    },
    {
      key: 'llm.gemini.model',
      value: 'gemini-1.5-flash',
      type: ConfigType.STRING,
      category: 'llm',
      description: 'Default Google Gemini model for text generation',
      environment: null,
      metadata: {
        alternatives: ['gemini-1.5-pro', 'gemini-1.0-pro'],
        costTier: 'free',
      },
    },
    {
      key: 'llm.anthropic.model',
      value: 'claude-3-sonnet-20240229',
      type: ConfigType.STRING,
      category: 'llm',
      description: 'Default Anthropic Claude model for text generation',
      environment: null,
      metadata: {
        alternatives: ['claude-3-opus-20240229', 'claude-3-haiku-20240307'],
        costTier: 'balanced',
      },
    },
  ];

  for (const config of configs) {
    const existing = await prisma.appConfig.findFirst({
      where: {
        key: config.key,
        environment: null,
      },
    });

    if (existing) {
      console.log(`⏭️  Config ${config.key} already exists, skipping`);
      continue;
    }

    await prisma.appConfig.create({
      data: {
        ...config,
        createdBy: 'system',
        updatedBy: 'system',
      },
    });

    console.log(`✅ Created config: ${config.key} = ${config.value}`);
  }

  console.log('✨ LLM Config seeding completed!');
}

seedLLMConfigs()
  .catch((e) => {
    console.error('❌ Error seeding LLM configs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
