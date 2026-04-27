import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildLegalDocumentBody, DEFAULT_LEGAL_DOCUMENTS, parseLegalDocumentBody, resolveLegalDocument } from '@/lib/legal-documents';


test('parseLegalDocumentBody parses headings, paragraphs, and bullet items', () => {
  const body = [
    '## 수집하는 정보',
    '첫 문단입니다.',
    '',
    '둘째 문단입니다.',
    '',
    '- 항목 A',
    '- 항목 B',
    '',
    '## 이용 목적',
    '목적 문단입니다.',
  ].join('\n');

  assert.deepEqual(parseLegalDocumentBody(body), [
    {
      title: '수집하는 정보',
      paragraphs: ['첫 문단입니다.', '둘째 문단입니다.'],
      items: ['항목 A', '항목 B'],
    },
    {
      title: '이용 목적',
      paragraphs: ['목적 문단입니다.'],
    },
  ]);
});

test('buildLegalDocumentBody serializes sections into editable text format', () => {
  const body = buildLegalDocumentBody([
    {
      title: '약관 안내',
      paragraphs: ['첫 문단', '둘째 문단'],
      items: ['항목 1'],
    },
  ]);

  assert.equal(body, ['## 약관 안내', '첫 문단', '', '둘째 문단', '', '- 항목 1'].join('\n'));
});

test('default legal documents include youth, ad, and mobile pages and resolve fallback content', () => {
  assert.ok(DEFAULT_LEGAL_DOCUMENTS.youth);
  assert.ok(DEFAULT_LEGAL_DOCUMENTS.ad);
  assert.ok(DEFAULT_LEGAL_DOCUMENTS.mobile);

  const youth = resolveLegalDocument('youth');
  assert.equal(youth.slug, 'youth');
  assert.equal(youth.title, '청소년보호정책');
  assert.ok(youth.sections.length > 0);

  const ad = resolveLegalDocument('ad');
  assert.equal(ad.slug, 'ad');
  assert.equal(ad.title, '광고안내');
  assert.ok(ad.sections.length > 0);

  const mobile = resolveLegalDocument('mobile');
  assert.equal(mobile.slug, 'mobile');
  assert.equal(mobile.title, '모바일웹 안내');
  assert.ok(mobile.sections.length > 0);
});


test('resolveLegalDocument preserves updatedAt metadata when stored content exists', () => {
  const document = resolveLegalDocument('privacy', {
    title: '맞춤 개인정보처리방침',
    description: '설명',
    body: '## 기본 안내\n본문',
    updatedAt: '2026-04-26T12:34:56.000Z',
  });

  assert.equal(document.title, '맞춤 개인정보처리방침');
  assert.equal(document.updatedAt, '2026-04-26T12:34:56.000Z');
  assert.equal(document.sections[0]?.title, '기본 안내');
});
