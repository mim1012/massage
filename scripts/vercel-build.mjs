import { spawnSync } from 'node:child_process';

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...extraEnv },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const isDeployBuild = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (isDeployBuild && hasDatabaseUrl) {
  console.log('==> Running prisma migrate deploy before Next.js build');
  run('npx', ['prisma', 'migrate', 'deploy']);
} else {
  console.log('==> Skipping prisma migrate deploy (not a deploy build or DATABASE_URL missing)');
}

run('next', ['build', '--webpack']);
