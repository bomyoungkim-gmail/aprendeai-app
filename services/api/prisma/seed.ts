import { PrismaClient, ContentType, HighlightKind, TargetType, ExtractionStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in order due to foreign keys)
  // Clean existing data (commented out to avoid FK issues during hot-fix)
  // console.log('🧹 Cleaning existing data...');
  // await prisma.highlight.deleteMany();
  // await prisma.cornellNotes.deleteMany();
  // await prisma.contentExtraction.deleteMany();
  // await prisma.content.deleteMany();
  // await prisma.file.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.plan.deleteMany(); 

  // 0. Create Plans (Upsert)
  console.log('💳 Creating plans...');
  await prisma.plan.upsert({
    where: { code: 'FREE' },
    update: {},
    create: {
      code: 'FREE',
      name: 'Free Plan',
      description: 'Basic access for students',
      monthlyPrice: 0,
      yearlyPrice: 0,
      entitlements: {},
    }
  });

  await prisma.plan.upsert({
    where: { code: 'PREMIUM' },
    update: {},
    create: {
      code: 'PREMIUM',
      name: 'Premium Plan',
      description: 'Full access including advanced AI features',
      monthlyPrice: 29.90,
      yearlyPrice: 299.90,
      entitlements: { "ai_access": true },
    }
  });
  console.log('✅ Created plans');

  // 1. Create demo users
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const student = await prisma.user.create({
    data: {
      name: 'Maria Silva',
      email: 'maria@example.com',
      passwordHash: hashedPassword,
      role: UserRole.STUDENT,
      schoolingLevel: 'high_school',
      age: 16,
      sex: 'F',
      preferredLanguages: ['PT_BR', 'EN'],
    },
  });

  const teacher = await prisma.user.create({
    data: {
      name: 'Prof. João Santos',
      email: 'joao@example.com',
      passwordHash: hashedPassword,
      role: UserRole.TEACHER,
      schoolingLevel: 'university',
      age: 35,
      sex: 'M',
      preferredLanguages: ['PT_BR'],
    },
  });

  console.log(`✅ Created ${student.name} and ${teacher.name}`);

  // 2. Create file storage entries
  console.log('📁 Creating files...');
  const pdfFile = await prisma.file.create({
    data: {
      storageProvider: 'LOCAL',
      storageKey: 'uploads/photosynthesis-lesson.pdf',
      mimeType: 'application/pdf',
      sizeBytes: BigInt(1024 * 512), // 512KB
      checksumSha256: 'abc123def456',
      originalFilename: 'Photosynthesis - Biology Lesson.pdf',
    },
  });

  const imageFile = await prisma.file.create({
    data: {
      storageProvider: 'LOCAL',
      storageKey: 'uploads/cell-diagram.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: BigInt(1024 * 256), // 256KB
      checksumSha256: 'xyz789uvw012',
      originalFilename: 'Animal Cell Diagram.jpg',
    },
  });

  console.log(`✅ Created ${2} files`);

  // 3. Create content items
  console.log('📄 Creating content...');
  const pdfContent = await prisma.content.create({
    data: {
      type: ContentType.PDF,
      title: 'Photosynthesis: Converting Light to Energy',
      sourceUrl: 'https://example.com/photosynthesis-lesson.pdf',
      originalLanguage: 'EN',
      rawText: 'Photosynthesis is the process by which plants convert light energy into chemical energy...',
      ownerUserId: student.id,
      fileId: pdfFile.id,
      languageGuess: 'EN',
      createdBy: teacher.id,
    },
  });

  const imageContent = await prisma.content.create({
    data: {
      type: ContentType.IMAGE,
      title: 'Animal Cell Structure',
      sourceUrl: 'https://example.com/cell-diagram.jpg',
      originalLanguage: 'EN',
      rawText: 'Diagram showing nucleus, mitochondria, cell membrane, cytoplasm...',
      ownerUserId: student.id,
      fileId: imageFile.id,
      languageGuess: 'EN',
      createdBy: teacher.id,
    },
  });

  const articleContent = await prisma.content.create({
    data: {
      type: ContentType.ARTICLE,
      title: 'Climate Change and Its Effects on Ecosystems',
      sourceUrl: 'https://example.com/climate-article',
      originalLanguage: 'PT_BR',
      rawText: 'As mudanças climáticas têm impactado significativamente os ecossistemas ao redor do mundo. O aumento das temperaturas globais afeta a biodiversidade, os padrões de migração animal e a distribuição de espécies vegetais. Estudos recentes mostram que...',
      ownerUserId: student.id,
      languageGuess: 'PT_BR',
      createdBy: student.id,
    },
  });

  console.log(`✅ Created ${3} content items`);

  // 4. Create Cornell Notes
  console.log('📝 Creating Cornell notes...');
  const cornellNotes1 = await prisma.cornellNotes.create({
    data: {
      contentId: pdfContent.id,
      userId: student.id,
      cuesJson: [
        {
          id: 'cue-1',
          prompt: 'What are the two stages of photosynthesis?',
          linked_highlight_ids: ['hl-1'],
        },
        {
          id: 'cue-2',
          prompt: 'Where does the light-dependent reaction occur?',
          linked_highlight_ids: ['hl-2'],
        },
        {
          id: 'cue-3',
          prompt: 'What is the chemical equation for photosynthesis?',
          linked_highlight_ids: [],
        },
      ],
      notesJson: [
        {
          id: 'note-1',
          body: 'Light-dependent reactions happen in thylakoid membranes. They produce ATP and NADPH.',
          linked_highlight_ids: ['hl-2'],
        },
        {
          id: 'note-2',
          body: 'Calvin cycle (light-independent) uses ATP and NADPH to fix CO2 into glucose.',
          linked_highlight_ids: ['hl-1'],
        },
        {
          id: 'note-3',
          body: 'Chlorophyll absorbs light energy, especially red and blue wavelengths.',
          linked_highlight_ids: [],
        },
      ],
      summaryText: 'Photosynthesis has two main stages: light-dependent reactions producing ATP/NADPH in thylakoids, and the Calvin cycle fixing CO2 into glucose in the stroma. Chlorophyll is essential for capturing light energy.',
    },
  });

  const cornellNotes2 = await prisma.cornellNotes.create({
    data: {
      contentId: articleContent.id,
      userId: student.id,
      cuesJson: [
        {
          id: 'cue-a',
          prompt: 'Quais são os principais impactos das mudanças climáticas?',
          linked_highlight_ids: ['hl-article-1'],
        },
      ],
      notesJson: [
        {
          id: 'note-a',
          body: 'Aumento de temperatura, mudança nos padrões de chuva, derretimento das calotas polares.',
          linked_highlight_ids: ['hl-article-1'],
        },
      ],
      summaryText: 'O artigo discute como as mudanças climáticas afetam ecossistemas através do aumento de temperatura e alterações nos hab itats naturais.',
    },
  });

  console.log(`✅ Created ${2} Cornell notes entries`);

  // 5. Create Highlights
  console.log('🖍️ Creating highlights...');
  const highlights = await prisma.highlight.createMany({
    data: [
      {
        id: 'hl-1',
        contentId: pdfContent.id,
        userId: student.id,
        kind: HighlightKind.TEXT,
        targetType: TargetType.PDF,
        pageNumber: 1,
        anchorJson: {
          type: 'PDF_TEXT',
          position: {
            boundingRect: { x1: 100, y1: 200, x2: 400, y2: 220, width: 300, height: 20 },
            rects: [{ x1: 100, y1: 200, x2: 400, y2: 220, width: 300, height: 20, pageNumber: 1 }],
            pageNumber: 1,
          },
          quote: 'The Calvin cycle occurs in the stroma of chloroplasts',
        },
        colorKey: 'yellow',
        commentText: 'Important: Location of Calvin cycle',
        tagsJson: ['photosynthesis', 'calvin-cycle'],
      },
      {
        id: 'hl-2',
        contentId: pdfContent.id,
        userId: student.id,
        kind: HighlightKind.TEXT,
        targetType: TargetType.PDF,
        pageNumber: 2,
        anchorJson: {
          type: 'PDF_TEXT',
          position: {
            boundingRect: { x1: 50, y1: 150, x2: 450, y2: 170, width: 400, height: 20 },
            rects: [{ x1: 50, y1: 150, x2: 450, y2: 170, width: 400, height: 20, pageNumber: 2 }],
            pageNumber: 2,
          },
          quote: 'Light-dependent reactions take place in the thylakoid membranes',
        },
        colorKey: 'green',
        commentText: 'Remember this for the exam!',
        tagsJson: ['photosynthesis', 'thylakoid'],
      },
      {
        id: 'hl-3',
        contentId: imageContent.id,
        userId: student.id,
        kind: HighlightKind.AREA,
        targetType: TargetType.IMAGE,
        pageNumber: null,
        anchorJson: {
          type: 'IMAGE_AREA',
          rect: { x: 120, y: 80, w: 200, h: 150 },
          zoom: 1,
          viewport: { width: 800, height: 600 },
        },
        colorKey: 'red',
        commentText: 'Mitochondria - powerhouse of the cell',
        tagsJson: ['cell-structure', 'organelles '],
      },
      {
        id: 'hl-article-1',
        contentId: articleContent.id,
        userId: student.id,
        kind: HighlightKind.TEXT,
        targetType: TargetType.DOCX,
        pageNumber: null,
        anchorJson: {
          type: 'DOCX_TEXT',
          range: {
            startPath: ['body', 'p', '0'],
            startOffset: 15,
            endPath: ['body', 'p', '0'],
            endOffset: 95,
          },
          quote: 'O aumento das temperaturas globais afeta a biodiversidade',
        },
        colorKey: 'blue',
        commentText: 'Impacto principal',
        tagsJson: ['clima', 'biodiversidade'],
      },
    ],
  });

  console.log(`✅ Created ${4} highlights`);

  // 6. Create Content Extractions (for OCR pipeline demo)
  console.log('🔍 Creating content extractions...');
  await prisma.contentExtraction.createMany({
    data: [
      {
        contentId: pdfContent.id,
        status: ExtractionStatus.DONE,
        extractedTextRef: 'extracted-text/photosynthesis-full.txt',
        metadataJson: {
          pageCount: 5,
          wordCount: 1247,
          confidence: 0.98,
          language: 'en',
        },
      },
      {
        contentId: imageContent.id,
        status: ExtractionStatus.PENDING,
        extractedTextRef: null,
        metadataJson: {
          imageWidth: 1200,
          imageHeight: 800,
          format: 'JPEG',
        },
      },
      {
        contentId: articleContent.id,
        status: ExtractionStatus.DONE,
        extractedTextRef: 'extracted-text/climate-article.txt',
        metadataJson: {
          wordCount: 856,
          confidence: 0.95,
          language: 'pt-BR',
        },
      },
    ],
  });

  console.log(`✅ Created ${3} content extractions`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   👥 Users: 2 (1 student, 1 teacher)`);
  console.log(`   📁 Files: 2 (1 PDF, 1 image)`);
  console.log(`   📄 Content: 3 (PDF, image, article)`);
  console.log(`   📝 Cornell Notes: 2`);
  console.log(`   🖍️ Highlights: 4`);
  console.log(`   🔍 Extractions: 3`);
  console.log('\n✅ You can now login with:');
  console.log(`   Email: maria@example.com`);
  console.log(`   Password: demo123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
