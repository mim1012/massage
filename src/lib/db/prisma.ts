import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, type PoolConfig } from 'pg';

const DEFAULT_LOCAL_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/massage_directory?schema=public';
const DEFAULT_DEVELOPMENT_POOL_MAX = 10;
const DEFAULT_PRODUCTION_POOL_MAX = 5;
const DEFAULT_SUPABASE_POOL_MAX = 1;
const DEFAULT_POOL_IDLE_TIMEOUT_MS = 5_000;
const DEFAULT_SUPABASE_IDLE_TIMEOUT_MS = 1_000;
const DEFAULT_CONNECTION_TIMEOUT_MS = 10_000;
const DEFAULT_PRODUCTION_MAX_LIFETIME_SECONDS = 60;
const DEFAULT_SUPABASE_MAX_LIFETIME_SECONDS = 15;


const globalForPrisma = globalThis as typeof globalThis & {
  __massagePgPool?: Pool;
  prisma?: PrismaClient;
};

function isSupabaseHost(hostname: string) {
  return hostname === 'supabase.co' || hostname.endsWith('.supabase.co') || hostname.endsWith('.supabase.com');
}

function isStrictProductionEnv(env: NodeJS.ProcessEnv) {
  return env.VERCEL === '1' || env.VERCEL_ENV === 'production';
}

function parsePositiveNumber(value: string | null | undefined) {
  const parsed = value ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const configured = env.DATABASE_URL?.trim();
  if (configured) {
    return configured;
  }

  if (isStrictProductionEnv(env)) {
    throw new Error('DATABASE_URL must be set in production deploy environments.');
  }

  return DEFAULT_LOCAL_DATABASE_URL;
}

export function resolvePoolMax(url: URL, env: NodeJS.ProcessEnv = process.env) {
  const supabaseHost = isSupabaseHost(url.hostname);
  const configuredMax =
    env.PGPOOL_MAX ?? url.searchParams.get('pool_max') ?? url.searchParams.get('connection_limit') ?? url.searchParams.get('pool_size');
  const parsed = parsePositiveNumber(configuredMax);
  if (parsed) {
    return supabaseHost ? Math.min(parsed, DEFAULT_SUPABASE_POOL_MAX) : parsed;
  }

  if (supabaseHost) {
    return DEFAULT_SUPABASE_POOL_MAX;
  }

  if (env.NODE_ENV === 'production') {
    return DEFAULT_PRODUCTION_POOL_MAX;
  }

  return DEFAULT_DEVELOPMENT_POOL_MAX;
}

function resolveMaxLifetimeSeconds(env: NodeJS.ProcessEnv, isSupabase: boolean) {
  const configured = parsePositiveNumber(env.PG_MAX_LIFETIME_SECONDS ?? null);
  if (configured) {
    return isSupabase ? Math.min(configured, DEFAULT_SUPABASE_MAX_LIFETIME_SECONDS) : configured;
  }

  if (isSupabase) {
    return DEFAULT_SUPABASE_MAX_LIFETIME_SECONDS;
  }

  return env.NODE_ENV === 'production' ? DEFAULT_PRODUCTION_MAX_LIFETIME_SECONDS : 0;
}


function shouldUseSsl(url: URL) {
  const sslMode = url.searchParams.get('sslmode')?.toLowerCase();
  return sslMode === 'require' || sslMode === 'verify-ca' || sslMode === 'verify-full' || sslMode === 'no-verify' || isSupabaseHost(url.hostname);
}

function shouldRejectUnauthorized(url: URL, env: NodeJS.ProcessEnv) {
  const sslMode = url.searchParams.get('sslmode')?.toLowerCase();
  if (sslMode === 'no-verify') {
    return false;
  }

  const override = env.PG_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase();
  if (override === 'false') {
    return false;
  }

  if (override === 'true') {
    return true;
  }

  if (sslMode === 'verify-ca' || sslMode === 'verify-full') {
    return true;
  }

  if (isSupabaseHost(url.hostname)) {
    return false;
  }

  return true;
}

export function createPoolConfig(connectionString: string, env: NodeJS.ProcessEnv = process.env): PoolConfig {
  const url = new URL(connectionString);
  const supabaseHost = isSupabaseHost(url.hostname);
  const maxLifetimeSeconds = resolveMaxLifetimeSeconds(env, supabaseHost);
  const baseConfig: PoolConfig = {
    connectionString,
    max: resolvePoolMax(url, env),
    idleTimeoutMillis: supabaseHost ? DEFAULT_SUPABASE_IDLE_TIMEOUT_MS : DEFAULT_POOL_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT_MS,
    keepAlive: true,
    keepAliveInitialDelayMillis: 1_000,
    allowExitOnIdle: env.NODE_ENV !== 'production',
    ...(maxLifetimeSeconds > 0 ? { maxLifetimeSeconds } : {}),
  };

  if (!shouldUseSsl(url)) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    ssl: {
      rejectUnauthorized: shouldRejectUnauthorized(url, env),
    },
  };
}

export function getPgPool() {
  if (!globalForPrisma.__massagePgPool) {
    const pool = new Pool(createPoolConfig(resolveDatabaseUrl()));
    pool.on('error', (error) => {
      console.error('[db] unexpected pg pool error:', error);
    });
    globalForPrisma.__massagePgPool = pool;
  }

  return globalForPrisma.__massagePgPool;
}

export function createPrismaClient() {
  const adapter = new PrismaPg(getPgPool());
  return new PrismaClient({
    adapter,
    log: [],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}