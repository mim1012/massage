import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AdvertisingPageClient from '@/components/public/AdvertisingPageClient';
import type { ResolvedLegalDocument } from '@/lib/legal-documents';

function createDocument(bodyLine: string): ResolvedLegalDocument {
  return {
    slug: 'ad',
    eyebrow: 'Advertising Guide',
    title: '광고안내',
    description: '광고 진행 안내',
    note: '유의사항',
    body: `## 광고 상품 안내\n- ${bodyLine}`,
    sections: [
      {
        title: '광고 상품 안내',
        paragraphs: [],
        items: [bodyLine],
      },
    ],
  };
}

test('AdvertisingPageClient reads legacy 추천업체 labels from ad document body', () => {
  const html = renderToStaticMarkup(
    React.createElement(AdvertisingPageClient, {
      document: createDocument('추천업체 : 레거시 추천 문구'),
    }),
  );

  assert.match(html, /레거시 추천 문구/);
});

test('AdvertisingPageClient reads newer 추천업체 노출 labels from ad document body', () => {
  const html = renderToStaticMarkup(
    React.createElement(AdvertisingPageClient, {
      document: createDocument('추천업체 노출 : 신규 추천 문구'),
    }),
  );

  assert.match(html, /신규 추천 문구/);
});
