import { registerHooks } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');

function resolveWithCandidates(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.mjs'),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        !specifier.startsWith('node:') &&
        !specifier.startsWith('@/') &&
        !specifier.startsWith('./') &&
        !specifier.startsWith('../') &&
        path.extname(specifier) === ''
      ) {
        try {
          return nextResolve(`${specifier}.js`, context);
        } catch {
          // Fall through to local resolution logic below.
        }
      }

      if (specifier.startsWith('@/')) {
        const resolved = resolveWithCandidates(path.join(projectRoot, 'src', specifier.slice(2)));
        if (resolved) {
          return {
            shortCircuit: true,
            url: pathToFileURL(resolved).href,
          };
        }
      }

      if (specifier.startsWith('./') || specifier.startsWith('../')) {
        const parentPath = context.parentURL
          ? path.dirname(fileURLToPath(context.parentURL))
          : projectRoot;
        const resolved = resolveWithCandidates(path.resolve(parentPath, specifier));
        if (resolved) {
          return {
            shortCircuit: true,
            url: pathToFileURL(resolved).href,
          };
        }
      }

      throw error;
    }
  },
});
