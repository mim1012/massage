import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  normalizeShopDescription,
  sanitizeShopDescriptionHtml,
  stripShopDescriptionToText,
} from '../src/lib/shop-description';

test('sanitizeShopDescriptionHtml keeps supported rich text styles and images', () => {
  const input = '<p style="text-align:center;color:#1e40af;font-size:24px;font-family:Arial">안내</p><p><img src="data:image/png;base64,abc" alt="상세" style="width:100%;height:auto;position:fixed" /></p>';
  const output = sanitizeShopDescriptionHtml(input);

  assert.match(output, /text-align:center/);
  assert.match(output, /color:#1e40af/);
  assert.match(output, /font-size:24px/);
  assert.match(output, /font-family:Arial/);
  assert.match(output, /<img src="data:image\/png;base64,abc" alt="상세"/);
  assert.doesNotMatch(output, /position:fixed/);
});

test('sanitizeShopDescriptionHtml removes scripts and inline event handlers', () => {
  const input = '<p onclick="alert(1)">본문</p><script>alert(1)</script><img src="https://example.com/a.png" onerror="alert(2)" />';
  const output = sanitizeShopDescriptionHtml(input);

  assert.doesNotMatch(output, /onclick/);
  assert.doesNotMatch(output, /onerror/);
  assert.doesNotMatch(output, /<script/);
  assert.match(output, /본문/);
});

test('normalizeShopDescription converts plain text to safe html paragraphs', () => {
  const output = normalizeShopDescription('첫 줄\n둘째 줄');
  assert.equal(output, '<p>첫 줄<br />둘째 줄</p>');
});

test('stripShopDescriptionToText returns clean preview text', () => {
  const output = stripShopDescriptionToText('<p style="color:#1e40af">샵 <strong>소개</strong></p><p><img src="https://example.com/a.png" alt="a" /></p>');
  assert.equal(output, '샵 소개');
});
