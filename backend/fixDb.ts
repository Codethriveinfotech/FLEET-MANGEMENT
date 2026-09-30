import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const fixes = [
    // Kotlin expects 'password_hash', Prisma uses 'passwordHash'
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT ''`,
    // Sync existing data from passwordHash -> password_hash
    `UPDATE users SET password_hash = "passwordHash" WHERE password_hash = '' OR password_hash IS NULL`,
    // Kotlin expects 'name', already added before
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT DEFAULT ''`,
    // Sync name from firstName + lastName
    `UPDATE users SET name = CONCAT("firstName", ' ', "lastName") WHERE name = '' OR name IS NULL`,
    // Kotlin expects 'phone', already added before
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`,
    // Sync phone from phoneNumber
    `UPDATE users SET phone = COALESCE("phoneNumber", '') WHERE phone = '' OR phone IS NULL`,
  ];

  for (const sql of fixes) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`✅ OK: ${sql.substring(0, 60)}...`);
    } catch (e: any) {
      console.log(`⚠️  Skipped (may already exist): ${sql.substring(0, 60)}...`);
    }
  }

  console.log('\nAll Kotlin compatibility columns synced!');
}

main().finally(() => prisma.$disconnect());
