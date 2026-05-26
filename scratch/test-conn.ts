import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Connection successful');
    const count = await prisma.shop.count();
    console.log('Shop count:', count);
  } catch (error: unknown) {
    const errorRecord = error instanceof Error ? error : new Error(String(error));
    console.error('Error type:', errorRecord.constructor.name);
    console.error('Error code:', 'code' in errorRecord ? errorRecord.code : undefined);
    console.error('Error message:', errorRecord.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
