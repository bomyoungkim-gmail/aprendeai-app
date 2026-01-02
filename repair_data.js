
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

async function repair() {
  console.log('Starting data repair for missing content-file links...');

  const contentsToRepair = await prisma.contents.findMany({
    where: {
      file_id: null,
      metadata: {
        path: ['storageKey'],
        not: null,
      },
    },
  });

  console.log(`Found ${contentsToRepair.length} contents to repair.`);

  for (const content of contentsToRepair) {
    const storageKey = content.metadata.storageKey;
    console.log(`Processing content: ${content.title} (ID: ${content.id}) with storageKey: ${storageKey}`);

    try {
      // 1. Check if a file record already exists for this key
      let fileRecord = await prisma.files.findFirst({
        where: { storageKey: storageKey },
      });

      if (!fileRecord) {
        console.log(`  File record missing for key ${storageKey}. Creating one...`);
        
        // Infer mimetype from extension
        const ext = storageKey.split('.').pop().toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === 'pdf') mimeType = 'application/pdf';
        else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === 'txt') mimeType = 'text/plain';
        else if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

        fileRecord = await prisma.files.create({
          data: {
            id: uuidv4(),
            storageKey: storageKey,
            storageProvider: 'LOCAL',
            mimeType: mimeType,
            sizeBytes: 0, // Unknown, but enough for basic linking
            originalFilename: content.title + '.' + ext, // Best guess
          },
        });
      }

      // 2. Link the file record to the content
      await prisma.contents.update({
        where: { id: content.id },
        data: { file_id: fileRecord.id },
      });

      console.log(`  Linked content ${content.id} to file ${fileRecord.id}`);
    } catch (err) {
      console.error(`  Error repairing content ${content.id}:`, err.message);
    }
  }

  console.log('Repair complete.');
}

repair()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
