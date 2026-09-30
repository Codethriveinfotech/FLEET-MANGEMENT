import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

type Fix = { sql: string; desc: string };

const fixes: Fix[] = [
  // ── users ─────────────────────────────────────────
  { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT DEFAULT ''`, desc: 'users.name' },
  { sql: `UPDATE users SET name = CONCAT("firstName", ' ', "lastName") WHERE name = '' OR name IS NULL`, desc: 'sync users.name' },
  { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`, desc: 'users.phone' },
  { sql: `UPDATE users SET phone = COALESCE("phoneNumber", '') WHERE phone = '' OR phone IS NULL`, desc: 'sync users.phone' },
  { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT ''`, desc: 'users.password_hash' },
  { sql: `UPDATE users SET password_hash = "passwordHash" WHERE password_hash = '' OR password_hash IS NULL`, desc: 'sync users.password_hash' },
  { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number TEXT`, desc: 'users.license_number' },
  { sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_uri TEXT`, desc: 'users.photo_uri' },

  // ── vehicles ──────────────────────────────────────
  { sql: `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS number TEXT DEFAULT ''`, desc: 'vehicles.number' },
  { sql: `UPDATE vehicles SET number = COALESCE("plateNumber", '') WHERE number = '' OR number IS NULL`, desc: 'sync vehicles.number' },
  { sql: `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS model TEXT DEFAULT ''`, desc: 'vehicles.model (ensure default)' },
  { sql: `UPDATE vehicles SET model = COALESCE(make, '') WHERE model = '' OR model IS NULL`, desc: 'sync vehicles.model from make' },
  { sql: `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_uri TEXT`, desc: 'vehicles.image_uri' },
  { sql: `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS assigned_user_id TEXT`, desc: 'vehicles.assigned_user_id' },
  { sql: `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Truck'`, desc: 'vehicles.type' },
  { sql: `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_number TEXT DEFAULT ''`, desc: 'vehicles.registration_number' },
  { sql: `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mileage TEXT DEFAULT '0'`, desc: 'vehicles.mileage' },
  { sql: `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_status TEXT DEFAULT 'Valid'`, desc: 'vehicles.insurance_status' },
  { sql: `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS place TEXT DEFAULT ''`, desc: 'vehicles.place' },

  // ── fuel_logs ─────────────────────────────────────
  { sql: `ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS time TEXT DEFAULT ''`, desc: 'fuel_logs.time' },
  { sql: `ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS liters TEXT DEFAULT '0'`, desc: 'fuel_logs.liters' },
];

async function main() {
  console.log('Running full Kotlin compatibility DB fix...\n');
  for (const fix of fixes) {
    try {
      await prisma.$executeRawUnsafe(fix.sql);
      console.log(`✅  ${fix.desc}`);
    } catch (e: any) {
      console.log(`⚠️  ${fix.desc}: ${e.message?.split('\n')[0]}`);
    }
  }
  console.log('\n✅ All done! Kotlin backend should now start successfully.');
}

main().finally(() => prisma.$disconnect());
