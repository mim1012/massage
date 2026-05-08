import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Connection successful');
    const count = await prisma.shop.count();
    console.log('Shop count:', count);
  } catch (error: any) {
    console.error('Error type:', error.constructor.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
