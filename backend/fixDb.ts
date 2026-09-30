import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // Add 'phone' column (used by Kotlin backend) as nullable to avoid null value errors
    await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''`);
    console.log('Successfully added phone column for Kotlin backend');
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log('phone column already exists, skipping.');
    } else {
      console.error('Error:', e.message);
    }
  }

  // Sync existing data: copy phoneNumber -> phone where phone is blank
  try {
    await prisma.$executeRawUnsafe(`UPDATE users SET phone = "phoneNumber" WHERE phone = '' OR phone IS NULL`);
    console.log('Synced phoneNumber -> phone for existing rows');
  } catch (e: any) {
    console.error('Sync error:', e.message);
  }
}

main().finally(() => prisma.$disconnect());
