import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN name TEXT DEFAULT 'Test User'`);
    console.log('Successfully added name column back for Kotlin backend');
  } catch (e) {
    console.error('It might already exist:', e);
  }
}

main().finally(() => prisma.$disconnect());
