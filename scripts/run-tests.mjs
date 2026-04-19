import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const testDir = path.join(projectRoot, 'tests');

function findTestFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTestFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

const testFiles = findTestFiles(testDir);
if (testFiles.length === 0) {
  console.error('No test files found under tests/.');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    '--disable-warning=ExperimentalWarning',
    '--disable-warning=DeprecationWarning',
    '--experimental-transform-types',
    '--import',
    pathToFileURL(path.join(projectRoot, 'scripts', 'register-alias.mjs')).href,
    '--test',
    ...testFiles.map((filePath) => path.relative(projectRoot, filePath).split(path.sep).join('/')),
  ],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  },
);

process.exit(result.status ?? 1);
