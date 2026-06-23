import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDir, '..');
const srcRoot = path.join(projectRoot, 'src');

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectSourceFiles(fullPath);
      }

      if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        return [fullPath];
      }

      return [] as string[];
    }),
  );

  return files.flat();
}

test('runtime source avoids bare Prisma calls outside retry wrappers', async () => {
  const sourceFiles = await collectSourceFiles(srcRoot);
  const violations: string[] = [];

  for (const filePath of sourceFiles) {
    const relativePath = path.relative(projectRoot, filePath).split(path.sep).join('/');
    const source = await fs.readFile(filePath, 'utf8');

    if (/await prisma\./.test(source)) {
      violations.push(`${relativePath}: bare await prisma call`);
    }

    if (/const pending = prisma\./.test(source)) {
      violations.push(`${relativePath}: bare cached prisma promise`);
    }

    if (/return prisma\./.test(source)) {
      violations.push(`${relativePath}: bare return prisma call`);
    }
  }

  assert.deepEqual(violations, []);
});
