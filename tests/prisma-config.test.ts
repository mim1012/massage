import assert from 'node:assert/strict';
import test from 'node:test';
import { createPoolConfig, resolveDatabaseUrl, resolvePoolMax } from '@/lib/db/prisma';

test('resolveDatabaseUrl falls back locally when DATABASE_URL is missing', () => {
  const databaseUrl = resolveDatabaseUrl({ NODE_ENV: 'development' } as NodeJS.ProcessEnv);
  assert.equal(databaseUrl, 'postgresql://postgres:postgres@localhost:5432/massage_directory?schema=public');
});

test('resolveDatabaseUrl fails closed in strict production deploy environments', () => {
  assert.throws(
    () => resolveDatabaseUrl({ NODE_ENV: 'production', VERCEL_ENV: 'production' } as NodeJS.ProcessEnv),
    /DATABASE_URL must be set in production deploy environments/,
  );
});

test('resolvePoolMax keeps Supabase pools conservative unless overridden', () => {
  const poolMax = resolvePoolMax(new URL('postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require'), {
    NODE_ENV: 'development',
  } as NodeJS.ProcessEnv);

  assert.equal(poolMax, 1);
});

test('createPoolConfig keeps Supabase builds aggressively recycled to avoid exhausting session-mode poolers', () => {
  const config = createPoolConfig('postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require', {
    NODE_ENV: 'production',
  } as NodeJS.ProcessEnv);

  assert.equal(config.keepAlive, true);
  assert.equal(config.keepAliveInitialDelayMillis, 1_000);
  assert.equal(config.idleTimeoutMillis, 1_000);
  assert.equal(config.allowExitOnIdle, false);
  assert.equal(config.maxLifetimeSeconds, 15);
  assert.deepEqual(config.ssl, { rejectUnauthorized: false });
});

test('createPoolConfig honors verify-full SSL modes for certificate validation', () => {
  const config = createPoolConfig('postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=verify-full', {
    NODE_ENV: 'production',
  } as NodeJS.ProcessEnv);

  assert.deepEqual(config.ssl, { rejectUnauthorized: true });
});

test('createPoolConfig allows explicit SSL verification opt-out only when configured', () => {
  const config = createPoolConfig('postgresql://user:pass@db.example.com:5432/postgres?sslmode=no-verify', {
    NODE_ENV: 'production',
    PG_SSL_REJECT_UNAUTHORIZED: 'true',
    PGPOOL_MAX: '7',
    PG_MAX_LIFETIME_SECONDS: '120',
  } as NodeJS.ProcessEnv);

  assert.equal(config.max, 7);
  assert.equal(config.maxLifetimeSeconds, 120);
  assert.deepEqual(config.ssl, { rejectUnauthorized: false });
});
