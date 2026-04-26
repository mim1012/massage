import { spawnSync } from 'node:child_process';

function run(command, args, extraEnv = {}, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...extraEnv },
  });

  if (result.status !== 0 && !options.allowFailure) {
    process.exit(result.status ?? 1);
  }

  return result;
}

const isDeployBuild = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (isDeployBuild && hasDatabaseUrl) {
  console.log('==> Running prisma migrate deploy before Next.js build');
  const migrateResult = run('npx', ['prisma', 'migrate', 'deploy'], {}, { allowFailure: true });
  if (migrateResult.status !== 0) {
    console.warn('==> prisma migrate deploy failed; continuing build to avoid blocking deployment');
  }
} else {
  console.log('==> Skipping prisma migrate deploy (not a deploy build or DATABASE_URL missing)');
}

run('next', ['build', '--webpack']);
