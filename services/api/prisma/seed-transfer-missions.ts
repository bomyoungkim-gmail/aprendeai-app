import { PrismaClient, TransferMissionType, ScopeType } from '@prisma/client';

const prisma = new PrismaClient();

interface MissionTemplate {
  type: TransferMissionType;
  title: string;
  description: string;
  promptTemplate: string;
  rubricJson: { criteria: string[] };
  difficulty: number;
  tagsJson: string[];
}

const STANDARD_MISSIONS: MissionTemplate[] = [
  {
    type: 'HUGGING',
    title: 'Hugging (Contexto-alvo)',
    description: 'Conectar conceitos abstratos com contextos reais e cotidianos',
    promptTemplate: 'Onde isso aparece na vida real, no seu dia a dia, ou no trabalho/escola?',
    rubricJson: {
      criteria: ['clareza', 'especificidade', 'vínculo com conceito'],
    },
    difficulty: 1,
    tagsJson: ['contexto', 'aplicação', 'vida-real'],
  },
  {
    type: 'BRIDGING',
    title: 'Bridging (Princípio abstrato)',
    description: 'Identificar estruturas profundas e princípios gerais',
    promptTemplate: 'Qual é a estrutura profunda por trás disso? Explique como regra geral.',
    rubricJson: {
      criteria: ['abstração correta', 'generalização'],
    },
    difficulty: 2,
    tagsJson: ['abstração', 'princípios', 'generalização'],
  },
  {
    type: 'PRODUCTIVE_FAILURE',
    title: 'Productive Failure (High Road)',
    description: 'Tentar resolver antes de ver a resposta para ativar transferência',
    promptTemplate: 'Antes de ver a resposta, tente resolver/aplicar em um novo contexto: {contexto_novo}...',
    rubricJson: {
      criteria: ['tentativa honesta', 'estratégia', 'revisão pós-feedback'],
    },
    difficulty: 3,
    tagsJson: ['desafio', 'tentativa', 'aprendizado-ativo'],
  },
  {
    type: 'ICEBERG',
    title: 'Iceberg (Sistemas)',
    description: 'Analisar eventos, padrões, estruturas e modelos mentais',
    promptTemplate: 'Descreva evento → padrões → estruturas → modelos mentais para {conceito}.',
    rubricJson: {
      criteria: ['camadas completas', 'coerência causal'],
    },
    difficulty: 3,
    tagsJson: ['sistemas', 'pensamento-sistêmico', 'camadas'],
  },
  {
    type: 'CONNECTION_CIRCLE',
    title: 'Connection Circle (Causalidade)',
    description: 'Mapear variáveis e relações causais com feedback loops',
    promptTemplate: 'Liste 6–10 variáveis e conecte com setas: +/−, feedback loops.',
    rubricJson: {
      criteria: ['loops', 'sinais', 'justificativa'],
    },
    difficulty: 3,
    tagsJson: ['causalidade', 'feedback', 'sistemas'],
  },
  {
    type: 'ANALOGY',
    title: 'Analogy (Isomorfismo)',
    description: 'Criar analogias estruturais entre domínios diferentes',
    promptTemplate: 'Isso se parece com o quê em outro domínio? Explique o mapeamento elemento-a-elemento.',
    rubricJson: {
      criteria: ['mapeamento estrutural (não superficial)'],
    },
    difficulty: 2,
    tagsJson: ['analogia', 'transferência', 'mapeamento'],
  },
  {
    type: 'TIER2',
    title: 'Tier2 (Palavras-ponte)',
    description: 'Usar vocabulário acadêmico (Tier 2) para explicar conceitos',
    promptTemplate: 'Use 3 palavras Tier2 (analisar, evidência, estrutura...) para explicar o trecho.',
    rubricJson: {
      criteria: ['uso correto', 'precisão'],
    },
    difficulty: 2,
    tagsJson: ['vocabulário', 'tier2', 'linguagem-acadêmica'],
  },
  {
    type: 'MORPHOLOGY',
    title: 'Morphology (Raízes/prefixos/sufixos)',
    description: 'Decodificar significado através de morfologia',
    promptTemplate: 'Que partes da palavra ajudam a decodificar significado? Dê 2 exemplos.',
    rubricJson: {
      criteria: ['decomposição', 'transferência para palavra nova'],
    },
    difficulty: 2,
    tagsJson: ['morfologia', 'vocabulário', 'decodificação'],
  },
  {
    type: 'METACOGNITION',
    title: 'Metacognition (Prompts)',
    description: 'Promover reflexão metacognitiva sobre estratégias de aprendizado',
    promptTemplate: 'Com o que isso se parece? Que estratégia vou usar? O que vou checar?',
    rubricJson: {
      criteria: ['estratégia', 'monitoramento'],
    },
    difficulty: 2,
    tagsJson: ['metacognição', 'estratégia', 'monitoramento'],
  },
  {
    type: 'PKM',
    title: 'PKM (Artefato atômico + backlink)',
    description: 'Criar notas atômicas com conexões entre domínios',
    promptTemplate: 'Crie uma nota atômica e 2 backlinks: (1) domínio próximo, (2) domínio distante.',
    rubricJson: {
      criteria: ['atomicidade', 'links úteis'],
    },
    difficulty: 2,
    tagsJson: ['pkm', 'notas', 'conexões'],
  },
];

async function seedTransferMissions() {
  console.log('🌱 Starting Transfer Missions seed...');

  for (const mission of STANDARD_MISSIONS) {
    // Check if mission already exists (idempotency)
    const existing = await prisma.transfer_missions.findFirst({
      where: {
        type: mission.type,
        title: mission.title,
        scope_type: 'GLOBAL',
      },
    });

    if (existing) {
      console.log(`✓ Mission "${mission.title}" already exists, skipping...`);
      continue;
    }

    // Create new mission
    await prisma.transfer_missions.create({
      data: {
        type: mission.type,
        title: mission.title,
        description: mission.description,
        prompt_template: mission.promptTemplate,
        rubric_json: mission.rubricJson,
        difficulty: mission.difficulty,
        tags_json: mission.tagsJson,
        scope_type: 'GLOBAL',
        is_active: true,
      },
    });

    console.log(`✓ Created mission: "${mission.title}"`);
  }

  console.log('✅ Transfer Missions seed completed!');
}

seedTransferMissions()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
