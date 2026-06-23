const SHOP_IMAGE_BUCKET = 'shop-images';

type SupabaseStorageConfig = {
  origin: string;
  serviceRoleKey: string;
};

function getSupabaseStorageConfig(): SupabaseStorageConfig | null {
  const rawUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!rawUrl || !serviceRoleKey) {
    return null;
  }

  let origin: string;
  try {
    // SUPABASE_URL is stored with a /rest/v1 suffix; storage lives on the same origin.
    origin = new URL(rawUrl).origin;
  } catch {
    return null;
  }

  return { origin, serviceRoleKey };
}

export function isSupabaseStorageConfigured() {
  return getSupabaseStorageConfig() !== null;
}

let bucketEnsured = false;

async function ensureShopImageBucket(config: SupabaseStorageConfig) {
  if (bucketEnsured) {
    return;
  }

  const response = await fetch(`${config.origin}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: SHOP_IMAGE_BUCKET, name: SHOP_IMAGE_BUCKET, public: true }),
  });

  // 200 => created; 400/409 => bucket already exists. Both are acceptable.
  if (!response.ok && response.status !== 400 && response.status !== 409) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Failed to ensure Supabase storage bucket (${response.status}): ${detail.slice(0, 200)}`);
  }

  bucketEnsured = true;
}

export async function uploadShopImageToSupabase(objectPath: string, body: Buffer, contentType: string) {
  const config = getSupabaseStorageConfig();
  if (!config) {
    return null;
  }

  await ensureShopImageBucket(config);

  const response = await fetch(`${config.origin}/storage/v1/object/${SHOP_IMAGE_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: new Uint8Array(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase storage upload failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  return `${config.origin}/storage/v1/object/public/${SHOP_IMAGE_BUCKET}/${objectPath}`;
}
