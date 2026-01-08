
import { PrismaClient, ItemType, Language } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration from question_bank to item_bank...');
  const questions = await prisma.question_bank.findMany();
  console.log(`Found ${questions.length} legacy questions.`);

  let created = 0;
  let skipped = 0;

  for (const q of questions) {
    // Check if already migrated
    const existing = await prisma.item_bank.findFirst({
        where: { legacy_id: q.id } 
    });

    if (existing) {
        console.log(`Skipping ${q.id} (already migrated)`);
        skipped++;
        continue;
    }

    let type: ItemType = ItemType.OPEN_ENDED;
    let text = '';
    let options: any = null;
    let correctAnswer: any = q.answer;
    
    // Safety check for q.question
    const qData: any = typeof q.question === 'string' ? JSON.parse(q.question) : q.question;
    const aData: any = typeof q.answer === 'string' ? JSON.parse(q.answer) : q.answer;

    if (!qData) {
        console.warn(`Question ${q.id} has no data. Skipping.`);
        skipped++;
        continue;
    }

    if (q.game_type === 'CONCEPT_LINKING') {
       // Taboo
       type = ItemType.OPEN_ENDED; 
       text = `Describe "${qData.targetWord}"`;
       options = { forbiddenWords: qData.forbiddenWords };
    } else if (q.game_type === 'SRS_ARENA') {
       // Flashcard
       type = ItemType.OPEN_ENDED; // Flashcards are essentially open ended prompt -> recall
       text = qData.question;
    } else if (q.game_type === 'FREE_RECALL_SCORE') {
       type = ItemType.OPEN_ENDED;
       text = qData.prompt || qData.topic || "Explain this topic";
    } else if (q.game_type === 'QUIZ' || q.game_type === 'MULTIPLE_CHOICE') {
       type = ItemType.MULTIPLE_CHOICE;
       text = qData.question || qData.text || "Question Text Missing";
       options = qData.options; 
    } else {
       console.warn(`Unknown game_type: ${q.game_type}. Defaulting to OPEN_ENDED dump.`);
       text = JSON.stringify(qData).slice(0, 500); // Truncate if too long?
       type = ItemType.OPEN_ENDED;
    }

    // Language mapping
    let lang: Language = Language.PT_BR;
    if (q.language === 'en' || q.language === 'EN') lang = Language.EN;
    if (q.language === 'ko' || q.language === 'KO') lang = Language.KO;
    if (q.language === 'pt-BR' || q.language === 'pt') lang = Language.PT_BR;

    // Normalize Difficulty (1-5 -> 0.0-1.0)
    // 1 -> 0.2, 2 -> 0.4, 3 -> 0.6, 4 -> 0.8, 5 -> 1.0
    const difficulty = q.difficulty ? Math.min(Math.max(q.difficulty / 5.0, 0), 1) : 0.5;

    try {
        await prisma.item_bank.create({
            data: {
                type,
                text: text || "Empty Text", 
                options: options || undefined,
                correct_answer: correctAnswer || undefined,
                language: lang,
                difficulty, 
                tags: [q.subject, q.topic, q.game_type].filter(Boolean),
                metadata: {
                    education_level: q.education_level,
                    source_type: q.source_type,
                    universal_concept_id: q.universal_concept_id,
                    original_game_type: q.game_type
                },
                legacy_id: q.id
            }
        });
        created++;
    } catch (e) {
        console.error(`Failed to migrate question ${q.id}: ${e.message}`);
    }
  }

  console.log(`Migration complete. Created: ${created}, Skipped: ${skipped}`);
}

migrate()
  .catch(e => {
      console.error(e);
      process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
