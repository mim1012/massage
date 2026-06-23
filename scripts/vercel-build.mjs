import { spawnSync } from 'node:child_process';

function run(command, args, extraEnv = {}, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...extraEnv },
    ...(options.timeoutMs ? { timeout: options.timeoutMs } : {}),
  });

  if (result.status !== 0 && !options.allowFailure) {
    process.exit(result.status ?? 1);
  }

  return result;
}

const isDeployBuild = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (isDeployBuild && hasDatabaseUrl) {
  // Prisma Migrate relies on session-level advisory locks, which Supabase's transaction
  // pooler (pgbouncer on :6543) does not support — running migrate through it hangs forever.
  // Run migrations against MIGRATE_DATABASE_URL (a session pooler / direct connection) when
  // provided, while the app runtime keeps using DATABASE_URL (transaction pooler). The timeout
  // guarantees a stuck pooled connection can never block the deploy.
  const migrateDatabaseUrl = process.env.MIGRATE_DATABASE_URL?.trim() || process.env.DATABASE_URL;
  console.log('==> Running prisma migrate deploy before Next.js build');
  const migrateResult = run(
    'npx',
    ['prisma', 'migrate', 'deploy'],
    { DATABASE_URL: migrateDatabaseUrl },
    { allowFailure: true, timeoutMs: 120_000 },
  );
  if (migrateResult.status !== 0) {
    console.warn('==> prisma migrate deploy failed or timed out; continuing build to avoid blocking deployment');
  }
} else {
  console.log('==> Skipping prisma migrate deploy (not a deploy build or DATABASE_URL missing)');
}

run('next', ['build', '--webpack']);
