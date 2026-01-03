import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING DATA MIGRATION ---');

  // 1. Migrate Annotations Table
  console.log('Migrating annotations table...');
  const annotations = await prisma.annotations.findMany();
  for (const ann of annotations) {
    let newType: any = ann.type;
    if (ann.type === 'HIGHLIGHT' as any) newType = 'EVIDENCE';
    else if (ann.type === 'NOTE' as any) newType = 'VOCABULARY';
    
    // Check if it already has tags that imply MAIN_IDEA or DOUBT in other tables? 
    // Usually annotations table is for the "generic" highlights.

    if (newType !== ann.type) {
      await prisma.annotations.update({
        where: { id: ann.id },
        data: { type: newType }
      });
    }
  }

  // 2. Migrate Highlights Table (Cornell Notes)
  console.log('Migrating highlights table...');
  const highlights = await prisma.highlights.findMany();
  for (const h of highlights) {
    let tags = (h.tags_json as string[]) || [];
    let updated = false;

    // Mapping tags to the new standard
    if (tags.includes('highlight')) {
      tags = tags.filter(t => t !== 'highlight');
      if (!tags.includes('evidence')) tags.push('evidence');
      updated = true;
    }
    if (tags.includes('note')) {
      tags = tags.filter(t => t !== 'note');
      if (!tags.includes('vocab')) tags.push('vocab');
      updated = true;
    }
    if (tags.includes('important') || tags.includes('star')) {
       tags = tags.filter(t => t !== 'important' && t !== 'star');
       if (!tags.includes('main-idea')) tags.push('main-idea');
       updated = true;
    }
    if (tags.includes('question')) {
      tags = tags.filter(t => t !== 'question');
      if (!tags.includes('doubt')) tags.push('doubt');
      updated = true;
    }
    if (tags.includes('summary')) {
      tags = tags.filter(t => t !== 'summary');
      if (!tags.includes('synthesis')) tags.push('synthesis');
      updated = true;
    }

    if (updated) {
      await prisma.highlights.update({
        where: { id: h.id },
        data: { tags_json: tags as any }
      });
    }
  }

  console.log('--- MIGRATION COMPLETE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
