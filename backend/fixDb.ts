import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Fixing vehicles, refresh_tokens, and users table schema and triggers...\n');

  // ==========================================
  // 1. VEHICLES TABLE FIXES & TRIGGERS
  // ==========================================
  console.log('--- Configuring vehicles table ---');

  // Ensure snake_case and camelCase columns exist on vehicles table
  await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS "plateNumber" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS "make" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS "year" INT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS "model" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();`);
  await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();`);
  await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS number TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_number TEXT;`);

  // Drop NOT NULL constraints so BEFORE trigger can supply defaults cleanly
  try { await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ALTER COLUMN "plateNumber" DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ALTER COLUMN "make" DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ALTER COLUMN "year" DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ALTER COLUMN "updatedAt" DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE vehicles ALTER COLUMN "model" DROP NOT NULL;`); } catch (e) {}

  // Create sync_vehicle_columns trigger function
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION sync_vehicle_columns()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Sync plateNumber <-> number / registration_number
      IF NEW.number IS NOT NULL AND NEW.number != '' THEN
        NEW."plateNumber" := NEW.number;
      ELSIF NEW.registration_number IS NOT NULL AND NEW.registration_number != '' THEN
        NEW."plateNumber" := NEW.registration_number;
      ELSIF NEW."plateNumber" IS NOT NULL AND NEW."plateNumber" != '' THEN
        NEW.number := NEW."plateNumber";
        NEW.registration_number := NEW."plateNumber";
      ELSE
        NEW."plateNumber" := 'UNKNOWN-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
      END IF;

      -- Sync make
      IF NEW."make" IS NULL OR NEW."make" = '' THEN
        IF NEW.type IS NOT NULL AND NEW.type != '' THEN
          NEW."make" := NEW.type;
        ELSE
          NEW."make" := 'Generic';
        END IF;
      END IF;

      -- Sync year
      IF NEW."year" IS NULL THEN
        NEW."year" := 2024;
      END IF;

      -- Sync model
      IF NEW.model IS NOT NULL AND NEW.model != '' THEN
        NEW."model" := NEW.model;
      ELSIF NEW."model" IS NULL OR NEW."model" = '' THEN
        NEW."model" := 'Standard';
      END IF;

      -- Sync updatedAt
      IF NEW."updatedAt" IS NULL THEN
        NEW."updatedAt" := NOW();
      END IF;

      -- Sync createdAt
      IF NEW."createdAt" IS NULL THEN
        NEW."createdAt" := NOW();
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_sync_vehicle_columns ON vehicles;`);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_sync_vehicle_columns
    BEFORE INSERT OR UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION sync_vehicle_columns();
  `);
  console.log('✅ Created trigger trg_sync_vehicle_columns on vehicles table');

  // ==========================================
  // 2. REFRESH_TOKENS TABLE FIXES & TRIGGERS
  // ==========================================
  console.log('--- Configuring refresh_tokens table ---');
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_id TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS "userId" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT false;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS "isRevoked" BOOLEAN DEFAULT false;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`);
  await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();`);

  try { await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ALTER COLUMN "userId" DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ALTER COLUMN user_id DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ALTER COLUMN "expiresAt" DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE refresh_tokens ALTER COLUMN expires_at DROP NOT NULL;`); } catch (e) {}

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION sync_refresh_token_columns()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.user_id IS NOT NULL THEN
        NEW."userId" := NEW.user_id;
      ELSIF NEW."userId" IS NOT NULL THEN
        NEW.user_id := NEW."userId";
      END IF;

      IF NEW.is_revoked IS NOT NULL THEN
        NEW."isRevoked" := NEW.is_revoked;
      ELSIF NEW."isRevoked" IS NOT NULL THEN
        NEW.is_revoked := NEW."isRevoked";
      END IF;

      IF NEW.expires_at IS NOT NULL THEN
        NEW."expiresAt" := NEW.expires_at::timestamp;
      ELSIF NEW."expiresAt" IS NOT NULL THEN
        NEW.expires_at := NEW."expiresAt"::timestamp;
      END IF;

      IF NEW.created_at IS NOT NULL THEN
        NEW."createdAt" := NEW.created_at::timestamp;
      ELSIF NEW."createdAt" IS NOT NULL THEN
        NEW.created_at := NEW.created_at::timestamp;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_sync_refresh_token_columns ON refresh_tokens;`);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_sync_refresh_token_columns
    BEFORE INSERT OR UPDATE ON refresh_tokens
    FOR EACH ROW EXECUTE FUNCTION sync_refresh_token_columns();
  `);
  console.log('✅ Created trigger trg_sync_refresh_token_columns on refresh_tokens table');

  // ==========================================
  // 3. USERS TABLE FIXES & TRIGGERS
  // ==========================================
  console.log('--- Configuring users table ---');
  await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();`);
  await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`);

  try { await prisma.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN "passwordHash" DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN "updatedAt" DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN "firstName" DROP NOT NULL;`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN "lastName" DROP NOT NULL;`); } catch (e) {}

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION sync_user_columns()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.password_hash IS NOT NULL AND NEW.password_hash != '' THEN
        NEW."passwordHash" := NEW.password_hash;
      ELSIF NEW."passwordHash" IS NOT NULL AND NEW."passwordHash" != '' THEN
        NEW.password_hash := NEW."passwordHash";
      END IF;

      IF NEW.name IS NOT NULL AND NEW.name != '' THEN
        NEW."firstName" := COALESCE(SPLIT_PART(NEW.name, ' ', 1), NEW.name);
        NEW."lastName" := COALESCE(SUBSTRING(NEW.name FROM LENGTH(SPLIT_PART(NEW.name, ' ', 1)) + 2), 'User');
      END IF;

      IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
        NEW."phoneNumber" := NEW.phone;
      ELSIF NEW."phoneNumber" IS NOT NULL AND NEW."phoneNumber" != '' THEN
        NEW.phone := NEW."phoneNumber";
      END IF;

      IF NEW.updated_at IS NOT NULL THEN
        NEW."updatedAt" := NEW.updated_at::timestamp;
      ELSIF NEW."updatedAt" IS NULL THEN
        NEW."updatedAt" := NOW();
      END IF;

      IF NEW.created_at IS NOT NULL THEN
        NEW."createdAt" := NEW.created_at::timestamp;
      ELSIF NEW."createdAt" IS NULL THEN
        NEW."createdAt" := NOW();
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_sync_user_columns ON users;`);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_sync_user_columns
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION sync_user_columns();
  `);
  console.log('✅ Created trigger trg_sync_user_columns on users table');

  console.log('\n🎉 ALL DB FIXES AND TRIGGERS APPLIED SUCCESSFULLY!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
