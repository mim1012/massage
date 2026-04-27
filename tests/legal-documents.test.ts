import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildLegalDocumentBody, parseLegalDocumentBody } from '@/lib/legal-documents';

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
