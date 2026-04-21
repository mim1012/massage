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

function resolvePoolMax(url: URL) {
  const configuredMax =
    process.env.PGPOOL_MAX ??
    url.searchParams.get('pool_max') ??
    url.searchParams.get('connection_limit') ??
    url.searchParams.get('pool_size');

  const parsed = configuredMax ? Number(configuredMax) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return process.env.NODE_ENV === 'production' ? 1 : 10;
}

function createPoolConfig(connectionString: string): PoolConfig {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get('sslmode');
  const useSsl = sslMode === 'require' || url.hostname.endsWith('supabase.co');

  return {
    connectionString,
    max: resolvePoolMax(url),
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
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
