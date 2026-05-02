import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Attempting to connect to database...');
    const result = await prisma.shop.findMany({ take: 1 });
    console.log('Connection successful:', result);
  } catch (error) {
    console.error('Connection failed:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
