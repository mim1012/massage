import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, type PoolConfig } from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/massage_directory?schema=public';

const globalForPrisma = globalThis as typeof globalThis & {
  __massagePgPool?: Pool;
  prisma?: PrismaClient;
};

function createPoolConfig(connectionString: string): PoolConfig {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get('sslmode');
  const useSsl = sslMode === 'require' || url.hostname.endsWith('supabase.co');

  return {
    connectionString,
    ...(useSsl
      ? {
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : {}),
  };
}

export function getPgPool() {
  if (!globalForPrisma.__massagePgPool) {
    globalForPrisma.__massagePgPool = new Pool(createPoolConfig(DATABASE_URL));
  }

  return globalForPrisma.__massagePgPool;
}

export function createPrismaClient() {
  const adapter = new PrismaPg(getPgPool());
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
