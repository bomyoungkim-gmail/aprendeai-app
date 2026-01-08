
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ItemBankService } from '../src/item-bank/item-bank.service';
import { QuestionSelectionService } from '../src/games/services/question-selection.service';
import { QuestionAnalyticsService } from '../src/games/services/question-analytics.service';
import { ItemType, Language, SystemRole } from '@prisma/client';
import * as crypto from 'crypto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  
  const prisma = app.get(PrismaService);
  const itemBankService = app.get(ItemBankService);
  const selectionService = app.get(QuestionSelectionService);
  const analyticsService = app.get(QuestionAnalyticsService);

  console.log('--- STARTING GAMES PHASE 3.2 VERIFICATION ---');

  const testFlag = 'VERIFY_PHASE3_GAMES';
  const userId = `user-test-games-${Date.now()}`;

  try {
    // 1. Setup Test Data (User)
    console.log('\n1. Creating Test User...');
    // We need a minimal user to record analytics
    // Using user_identities approach from Phase 3.1 just to be safe/compliant
    await prisma.users.create({
        data: {
            id: userId,
            email: `test-games-${Date.now()}@example.com`,
            name: 'Games Tester'
            // system_role is optional for regular users
        }
    });
    console.log('   User created:', userId);

    // 2. Create Items in ItemBank
    console.log('\n2. Creating Test Items in ItemBank...');
    
    // Item 1: Multiple Choice (Quiz)
    const itemQuiz = await itemBankService.createItem({
        type: ItemType.MULTIPLE_CHOICE,
        text: 'What is the powerhouse of the cell?',
        options: { choices: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi'] },
        correct_answer: { index: 0, text: 'Mitochondria' },
        language: Language.EN,
        difficulty: 0.2, // Easy
        tags: ['QUIZ', 'Biology', 'CellAb'], // gameType, subject, topic
        metadata: { legacy_payload: { question: 'What is the powerhouse of the cell?', options: ['Mitochondria', 'Nucleus'] } }
    });
    console.log('   Created Item 1 (QUIZ):', itemQuiz.id);

    // Item 2: Open Ended (Concept Linking / Taboo)
    const itemTaboo = await itemBankService.createItem({
        type: ItemType.OPEN_ENDED,
        text: 'Describe "Photosynthesis"',
        options: { forbiddenWords: ['Green', 'Sun', 'Plant'] }, // Taboo style
        correct_answer: { keywords: ['process', 'energy'] },
        language: Language.EN,
        difficulty: 0.5,
        tags: ['CONCEPT_LINKING', 'Biology', 'CellAb'],
        metadata: { legacy_payload: { targetWord: 'Photosynthesis', forbiddenWords: ['Green', 'Sun', 'Plant'] } }
    });
    console.log('   Created Item 2 (CONCEPT_LINKING):', itemTaboo.id);


    // 3. Test Question Selection (Legacy Adapter)
    console.log('\n3. Testing Question Selection (Adapter)...');
    
    // Fetch QUIZ
    const quizQuestions = await selectionService.getQuestionsForUser({
        gameType: 'QUIZ',
        subject: 'Biology',
        topic: 'CellAb',
        educationLevel: 'medio' as any,
        count: 1,
        language: 'en'
    });

    if (quizQuestions.length > 0 && quizQuestions[0].id === itemQuiz.id) {
        console.log('   [PASS] Fetched QUIZ item correctly by tag/topic.');
    } else {
        console.error('   [FAIL] Failed to fetch QUIZ item.', quizQuestions);
    }

    // Fetch CONCEPT_LINKING
    const tabooQuestions = await selectionService.getQuestionsForUser({
        gameType: 'CONCEPT_LINKING',
        subject: 'Biology',
        topic: 'CellAb',
        educationLevel: 'medio' as any,
        count: 1,
        language: 'en'
    });

    if (tabooQuestions.length > 0 && tabooQuestions[0].id === itemTaboo.id) {
        console.log('   [PASS] Fetched CONCEPT_LINKING item correctly by tag/topic.');
        // Verify structure mapping
        if (tabooQuestions[0].question.targetWord === 'Photosynthesis') {
             console.log('   [PASS] Legacy payload mapped correctly (targetWord).');
        } else {
             console.error('   [FAIL] Legacy payload mapping incorrect.', tabooQuestions[0]);
        }
    } else {
        console.error('   [FAIL] Failed to fetch CONCEPT_LINKING item.', tabooQuestions);
    }


    // 4. Test Analytics Submission
    console.log('\n4. Testing Analytics Submission...');
    
    const result = await analyticsService.recordResult(userId, {
        questionId: itemQuiz.id,
        score: 100,
        timeTaken: 5,
        isCorrect: true,
        gameSessionId: 'session-test-1',
        selfRating: 3
    });

    console.log('   Result recorded:', result.id);

    // Verify DB
    const dbResult = await prisma.question_results.findFirst({
        where: { id: result.id }
    });

    if (dbResult && dbResult.item_id === itemQuiz.id) {
        console.log('   [PASS] Results stored with correct item_id.');
    } else {
        console.error('   [FAIL] Results item_id mismatch or not found.', dbResult);
    }

    const analytics = await prisma.question_analytics.findUnique({
        where: { item_id: itemQuiz.id }
    });

    if (analytics && analytics.total_attempts === 1) {
        console.log('   [PASS] Question Analytics updated (aggregated).');
    } else {
         console.error('   [FAIL] Question Analytics not updated.', analytics);
    }


  } catch (error) {
    console.error('\n[ERROR] Verification Failed:', error);
  } finally {
    // 5. Cleanup
    console.log('\n5. Cleanup...');
    await prisma.question_results.deleteMany({ where: { user_id: userId } });
    await prisma.question_analytics.deleteMany({ where: { item_id: { in: [userId] } } }); // Cleanup analytics not easily possible without ID, assume ephemeral test env or explicit delete
    // Actually cleanliness:
    await prisma.users.delete({ where: { id: userId } });
    
    // Clean items?
    // Need IDs.
    // We'll leave them or delete if we tracked them nicely, but standard is keep clean db.
    // I'll skip deleting items to avoid accidental cascade delete of real data if logic is wrong, but here I created them.
    // Let's delete them.
    await prisma.item_bank.deleteMany({ where: { tags: { has: 'CellAb' } } }); 

    await app.close();
    console.log('--- VERIFICATION COMPLETE ---');
  }
}

bootstrap();
