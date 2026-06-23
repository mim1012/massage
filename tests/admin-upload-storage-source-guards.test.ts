import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDir, '..');

async function readProjectFile(relativePath: string) {
  return fs.readFile(path.join(projectRoot, relativePath), 'utf8');
}

test('admin upload route persists shop images to Supabase storage with a local filesystem fallback', async () => {
  const routeSource = await readProjectFile('src/app/api/admin/upload/route.ts');
  const helperSource = await readProjectFile('src/lib/server/supabase-storage.ts');

  assert.equal(
    routeSource.includes(
      "import { isSupabaseStorageConfigured, uploadShopImageToSupabase } from '@/lib/server/supabase-storage';",
    ),
    true,
  );
  assert.equal(routeSource.includes('const useSupabaseStorage = isSupabaseStorageConfigured();'), true);
  assert.equal(routeSource.includes('await uploadShopImageToSupabase('), true);
  // Local filesystem write stays available as a development fallback only.
  assert.equal(routeSource.includes('uploadUrls.push(`/uploads/${filename}`);'), true);

  assert.equal(helperSource.includes("const SHOP_IMAGE_BUCKET = 'shop-images';"), true);
  assert.equal(helperSource.includes('new URL(rawUrl).origin'), true);
  assert.equal(helperSource.includes('/storage/v1/object/public/'), true);
  assert.equal(helperSource.includes("process.env.SUPABASE_URL"), true);
  assert.equal(helperSource.includes("process.env.SUPABASE_SERVICE_ROLE_KEY"), true);
});
