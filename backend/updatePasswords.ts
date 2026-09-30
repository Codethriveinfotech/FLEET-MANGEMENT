import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  const hashAdmin = bcrypt.hashSync('admin123', 10);
  const hashDriver = bcrypt.hashSync('driver123', 10);

  await prisma.user.updateMany({
    where: { email: 'testadmin@example.com' },
    data: { passwordHash: hashAdmin }
  });

  await prisma.user.updateMany({
    where: { email: 'driver@example.com' },
    data: { passwordHash: hashDriver }
  });

  console.log('Passwords updated to use real bcrypt hashes.');
}

main().finally(() => prisma.$disconnect());
