const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Available models in prisma client:', Object.keys(prisma).filter(k => !k.startsWith('_')));
  
  const model = prisma.decision_logs || prisma.decisionLogs;
  if (!model) {
    console.error('Model decision_logs not found in prisma client.');
    return;
  }

  const logs = await model.findMany({
    take: 1,
    orderBy: { created_at: 'desc' }
  });

  if (logs.length === 0) {
    console.log('No decision logs found.');
    return;
  }

  console.log('Last Decision Log:');
  console.log(JSON.stringify(logs[0], (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
