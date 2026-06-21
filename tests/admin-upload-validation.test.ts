import assert from 'node:assert/strict';
import test from 'node:test';
import { validateUploadFiles } from '@/app/api/admin/upload/upload-validation';

function fileOf(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

test('validateUploadFiles rejects non-image uploads by MIME and extension', async () => {
  assert.deepEqual(await validateUploadFiles([fileOf('payload.txt', 'text/plain', 12)]), {
    ok: false,
    status: 400,
    error: '이미지 파일만 업로드할 수 있습니다.',
  });

  assert.deepEqual(await validateUploadFiles([fileOf('payload.txt', 'image/png', 12)]), {
    ok: false,
    status: 400,
    error: '허용되지 않는 파일 확장자입니다.',
  });
});

test('validateUploadFiles rejects missing, excessive, and oversized files', async () => {
  assert.deepEqual(await validateUploadFiles([]), {
    ok: false,
    status: 400,
    error: '업로드할 파일이 없습니다.',
  });

  assert.deepEqual(await validateUploadFiles(Array.from({ length: 11 }, (_, index) => fileOf(`image-${index}.png`, 'image/png', 1))), {
    ok: false,
    status: 400,
    error: '파일은 최대 10개까지 업로드할 수 있습니다.',
  });

  assert.deepEqual(await validateUploadFiles([fileOf('large.png', 'image/png', 5 * 1024 * 1024 + 1)]), {
    ok: false,
    status: 400,
    error: '파일 크기는 5MB 이하만 업로드할 수 있습니다.',
  });
});

test('validateUploadFiles accepts allowed image MIME and extension pairs', async () => {
  const pngBytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const webpBytes = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);

  assert.deepEqual(await validateUploadFiles([
    new File([pngBytes], 'photo.png', { type: 'image/png' }),
    new File([webpBytes], 'banner.webp', { type: 'image/webp' }),
  ]), { ok: true });
});

test('validateUploadFiles rejects files whose bytes do not match the claimed image format', async () => {
  const disguisedPng = new File([Uint8Array.from([0x6e, 0x6f, 0x74, 0x2d, 0x70, 0x6e, 0x67])], 'fake.png', {
    type: 'image/png',
  });

  assert.deepEqual(await validateUploadFiles([disguisedPng]), {
    ok: false,
    status: 400,
    error: '실제 이미지 파일만 업로드할 수 있습니다.',
  });
});
