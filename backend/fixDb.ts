import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Inspecting and fixing refresh_tokens table and triggers...\n');

  // 1. Get list of columns in refresh_tokens table
  const columns: any[] = await prisma.$queryRawUnsafe(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'refresh_tokens';
  `);

  const columnNames = columns.map((c) => c.column_name);
  console.log('Existing columns in refresh_tokens:', columnNames);

  // Helper function to add column if missing
  async function addColumnIfMissing(colName: string, sqlTypeDef: string) {
    if (!columnNames.includes(colName) && !columnNames.includes(colName.toLowerCase())) {
      console.log(`Adding missing column ${colName} to refresh_tokens...`);
      await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS ${sqlTypeDef};`);
    }
  }

  // Ensure both snake_case and camelCase columns exist on refresh_tokens
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_id TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS "userId" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT false;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS "isRevoked" BOOLEAN DEFAULT false;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();`);

  // Make sure NOT NULL constraints on userId / user_id / expiresAt / expires_at don't block inserts before trigger runs
  try { await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ALTER COLUMN "userId" DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ALTER COLUMN user_id DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ALTER COLUMN "expiresAt" DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ALTER COLUMN expires_at DROP NOT NULL;`); } catch (e) {}

  console.log('✅ Columns verified and constraints adjusted.');

  // 2. Create trigger function without non-existent columns (e.g. no updatedAt)
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION sync_refresh_token_columns()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Sync user_id <-> userId
      IF NEW.user_id IS NOT NULL THEN
        NEW."userId" := NEW.user_id;
      ELSIF NEW."userId" IS NOT NULL THEN
        NEW.user_id := NEW."userId";
      END IF;

      -- Sync is_revoked <-> isRevoked
      IF NEW.is_revoked IS NOT NULL THEN
        NEW."isRevoked" := NEW.is_revoked;
      ELSIF NEW."isRevoked" IS NOT NULL THEN
        NEW.is_revoked := NEW."isRevoked";
      END IF;

      -- Sync expires_at <-> expiresAt
      IF NEW.expires_at IS NOT NULL THEN
        NEW."expiresAt" := NEW.expires_at::timestamp;
      ELSIF NEW."expiresAt" IS NOT NULL THEN
        NEW.expires_at := NEW."expiresAt"::timestamp;
      END IF;

      -- Sync created_at <-> createdAt
      IF NEW.created_at IS NOT NULL THEN
        NEW."createdAt" := NEW.created_at::timestamp;
      ELSIF NEW."createdAt" IS NOT NULL THEN
        NEW.created_at := NEW."createdAt"::timestamp;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  console.log('✅ Created updated trigger function sync_refresh_token_columns');

  // Re-attach trigger
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_sync_refresh_token_columns ON refresh_tokens;`);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_sync_refresh_token_columns
    BEFORE INSERT OR UPDATE ON refresh_tokens
    FOR EACH ROW EXECUTE FUNCTION sync_refresh_token_columns();
  `);
  console.log('✅ Attached trg_sync_refresh_token_columns to refresh_tokens table');

  console.log('\n🎉 DB fix completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
