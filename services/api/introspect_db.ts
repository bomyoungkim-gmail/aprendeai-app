import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'families'
    `;
    console.log("Columns in 'families' table:");
    console.log(JSON.stringify(result, null, 2));

    const resultEvents = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'session_events'
    `;
    console.log("\nColumns in 'session_events' table:");
    console.log(JSON.stringify(resultEvents, null, 2));

  } catch (e) {
    console.error("Error introspecting DB:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
