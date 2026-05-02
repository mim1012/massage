import crypto from 'node:crypto';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/massage_directory?schema=public';

const HASH_SEPARATOR = ':';
const KEY_LENGTH = 64;

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}${HASH_SEPARATOR}${derivedKey}`;
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  const email = 'admin2@massage.local';
  const password = 'admin1234';

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: hashPassword(password),
        name: 'Admin 2',
        role: UserRole.ADMIN,
        status: UserStatus.APPROVED,
      },
      create: {
        email,
        passwordHash: hashPassword(password),
        name: 'Admin 2',
        role: UserRole.ADMIN,
        status: UserStatus.APPROVED,
      },
    });

    console.log('Admin account created successfully:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('Error creating admin account:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
