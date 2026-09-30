import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring Admin user exists with correct password hash...');

  const passwordHash = await bcrypt.hash('fleet@123', 10);

  // Check if admin user exists by email, phone, or id
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { id: 'admin_id' },
        { email: 'admin@system.com' },
        { phoneNumber: 'admin' },
      ],
    },
  });

  if (existingUser) {
    console.log('Updating existing admin user:', existingUser.id);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        email: 'admin@system.com',
        phoneNumber: 'admin',
        passwordHash: passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    console.log('✅ Admin user updated with password fleet@123 and role SUPER_ADMIN');
  } else {
    console.log('Creating new admin user...');
    await prisma.user.create({
      data: {
        id: 'admin_id',
        email: 'admin@system.com',
        phoneNumber: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        passwordHash: passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    console.log('✅ Admin user created with password fleet@123 and role SUPER_ADMIN');
  }

  // Also query users to confirm
  const allUsers = await prisma.user.findMany();
  console.log('\nCurrent Users in DB:');
  allUsers.forEach((u) => {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Phone: ${u.phoneNumber}, Role: ${u.role}, Active: ${u.isActive}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
