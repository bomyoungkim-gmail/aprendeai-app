import { PrismaClient, ContentType, HighlightKind, TargetType, ExtractionStatus, SystemRole, ContextRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const dummyEntitlements = {
    features: {
      ai_chat: true,
      content_generation: true,
    },
    limits: {
      api_calls_per_day: 100,
    }
  };

  // 1. Upsert Plans
  console.log('💳 Creating plans...');
  await prisma.plans.upsert({
    where: { id: 'plan_free' },
    update: {},
    create: {
      id: 'plan_free',
      code: 'FREE',
      name: 'Free Plan',
      type: 'FREE',
      monthly_price: 0,
      yearly_price: 0,
      entitlements: dummyEntitlements,
      updated_at: new Date(),
    },
  });

  await prisma.plans.upsert({
    where: { id: 'plan_pro' },
    update: {},
    create: {
      id: 'plan_pro',
      code: 'PRO',
      name: 'Pro Plan',
      type: 'INDIVIDUAL_PREMIUM',
      monthly_price: 49.9,
      yearly_price: 499,
      entitlements: dummyEntitlements,
      updated_at: new Date(),
    },
  });

  // 2. Create Users
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const student = await prisma.users.upsert({
    where: { email: 'student@test.com' },
    update: {},
    create: {
      id: 'user_student_1',
      email: 'student@test.com',
      name: 'Student Test',
      password_hash: hashedPassword,
      last_context_role: 'STUDENT',
      schooling_level: 'FUNDAMENTAL_2',
    },
  });

  const teacher = await prisma.users.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      id: 'user_teacher_1',
      email: 'teacher@test.com',
      name: 'Teacher Test',
      password_hash: hashedPassword,
      last_context_role: 'TEACHER',
      schooling_level: 'SUPERIOR',
    },
  });

  // 3. Create Files
  console.log('📁 Creating files...');
  const pdfFile = await prisma.files.upsert({
    where: { id: 'file_pdf_1' },
    update: {},
    create: {
      id: 'file_pdf_1',
      storageProvider: 'LOCAL',
      storageKey: 'test.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    },
  });

  const imageFile = await prisma.files.upsert({
    where: { id: 'file_img_1' },
    update: {},
    create: {
      id: 'file_img_1',
      storageProvider: 'LOCAL',
      storageKey: 'test.png',
      mimeType: 'image/png',
      sizeBytes: 512,
    },
  });

  // 4. Create Contents
  console.log('📄 Creating contents...');
  const pdfContent = await prisma.contents.upsert({
    where: { id: 'content_pdf_1' },
    update: {},
    create: {
      id: 'content_pdf_1',
      type: 'PDF',
      title: 'Structural Geology Basics',
      original_language: 'PT_BR',
      raw_text: '...',
      file_id: pdfFile.id,
      owner_user_id: teacher.id,
      updated_at: new Date(),
    },
  });

  const imageContent = await prisma.contents.upsert({
    where: { id: 'content_img_1' },
    update: {},
    create: {
      id: 'content_img_1',
      type: 'IMAGE',
      title: 'Geological Map',
      original_language: 'PT_BR',
      raw_text: '...',
      file_id: imageFile.id,
      owner_user_id: teacher.id,
      updated_at: new Date(),
    },
  });

  const articleContent = await prisma.contents.upsert({
    where: { id: 'content_article_1' },
    update: {},
    create: {
      id: 'content_article_1',
      type: 'ARTICLE',
      title: 'Modern Education Trends',
      original_language: 'PT_BR',
      raw_text: 'Lorem ipsum...',
      owner_user_id: teacher.id,
      updated_at: new Date(),
    },
  });

  // 5. Create Cornell Notes
  console.log('📝 Creating Cornell notes...');
  await prisma.cornell_notes.upsert({
    where: { id: 'cornell_1' },
    update: {},
    create: {
      id: 'cornell_1',
      content_id: pdfContent.id,
      user_id: student.id,
      cues_json: [{ term: 'Fault', definition: 'A fracture...' }],
      notes_json: [{ point: 'Faults are key...' }],
      summary_text: 'Study of faults.',
      updated_at: new Date(),
    },
  });

  await prisma.cornell_notes.upsert({
    where: { id: 'cornell_2' },
    update: {},
    create: {
      id: 'cornell_2',
      content_id: articleContent.id,
      user_id: student.id,
      cues_json: [{ term: 'AI', definition: 'Artificial Intelligence' }],
      notes_json: [{ point: 'AI is changing...' }],
      summary_text: 'AI in education.',
      updated_at: new Date(),
    },
  });

  // 6. Create Highlights
  console.log('🖍️ Creating highlights...');
  await prisma.highlights.upsert({
    where: { id: 'hl-1' },
    update: {},
    create: {
      id: 'hl-1',
      content_id: pdfContent.id,
      user_id: student.id,
      kind: HighlightKind.TEXT,
      target_type: TargetType.PDF,
      color_key: 'yellow',
      anchor_json: { quote: 'fracture' },
      updated_at: new Date(),
    },
  });

  // 7. Create extractions if needed
  console.log('🔍 Creating content extractions...');
  await prisma.content_extractions.upsert({
    where: { id: 'extract_1' },
    update: {},
    create: {
      id: 'extract_1',
      content_id: pdfContent.id,
      status: 'DONE',
      updated_at: new Date(),
    },
  });

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
