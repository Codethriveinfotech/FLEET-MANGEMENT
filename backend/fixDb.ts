import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Setting up sync triggers between Kotlin and Prisma columns...\n');

  // Create a trigger function that syncs password_hash <-> passwordHash
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION sync_user_columns()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Sync password_hash -> passwordHash
      IF NEW.password_hash IS NOT NULL AND NEW.password_hash != '' THEN
        NEW."passwordHash" := NEW.password_hash;
      END IF;
      -- Sync passwordHash -> password_hash
      IF NEW."passwordHash" IS NOT NULL AND NEW."passwordHash" != '' THEN
        NEW.password_hash := NEW."passwordHash";
      END IF;

      -- Sync updated_at -> updatedAt (Kotlin -> Prisma)
      IF NEW.updated_at IS NOT NULL THEN
        NEW."updatedAt" := NEW.updated_at::timestamp;
      ELSIF NEW."updatedAt" IS NULL THEN
        NEW."updatedAt" := NOW();
      END IF;

      -- Sync created_at -> createdAt (Kotlin -> Prisma)
      IF NEW.created_at IS NOT NULL THEN
        NEW."createdAt" := NEW.created_at::timestamp;
      ELSIF NEW."createdAt" IS NULL THEN
        NEW."createdAt" := NOW();
      END IF;

      -- Sync name -> firstName/lastName
      IF NEW.name IS NOT NULL AND NEW.name != '' THEN
        IF NEW."firstName" IS NULL OR NEW."firstName" = '' THEN
          NEW."firstName" := split_part(NEW.name, ' ', 1);
        END IF;
        IF NEW."lastName" IS NULL OR NEW."lastName" = '' THEN
          NEW."lastName" := COALESCE(NULLIF(split_part(NEW.name, ' ', 2), ''), '-');
        END IF;
      END IF;

      -- Sync phone -> phoneNumber
      IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
        NEW."phoneNumber" := NEW.phone;
      END IF;

      -- Ensure isActive is set
      IF NEW."isActive" IS NULL THEN
        NEW."isActive" := true;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  console.log('✅ Created trigger function sync_user_columns');

  // Drop old trigger if exists, then create
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_sync_user_columns ON users;`);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_sync_user_columns
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION sync_user_columns();
  `);
  console.log('✅ Created trigger trg_sync_user_columns on users table');

  console.log('\n✅ Done! Kotlin backend can now insert/update users without column mismatch errors.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
