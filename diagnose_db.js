
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const contentId = 'fa0863c0-5556-49a9-8306-3e4813268cbd';
  console.log(`Inspecting content ID: ${contentId}`);

  const content = await prisma.contents.findUnique({
    where: { id: contentId },
    include: {
      files: true,
    },
  });

  if (!content) {
    console.log('Content not found in database.');
    return;
  }

  console.log('Content Record:');
  console.log(JSON.stringify(content, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));

  if (content.files) {
    console.log('\nAssociated File Record:');
    console.log(JSON.stringify(content.files, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2));
  } else {
    console.log('\nNo associated file record found (file_id is null or invalid).');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
