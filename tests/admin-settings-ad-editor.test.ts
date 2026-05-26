import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { AdCustomEditor, buildAdBody, parseAdBody } from '@/app/admin/settings/ad-guide-editor';

test('buildAdBody and parseAdBody round-trip recommendation field labels', () => {
  const body = buildAdBody({
    phone: '010-2222-3333',
    email: 'ads@test.com',
    kakao: 'ad_channel',
    hours: '평일 09:00 ~ 18:00',
    mainBanner: '메인 배너 설명',
    categoryAd: '카테고리 광고 설명',
    recomShop: '추천 노출 설명',
    popupAd: '팝업 광고 설명',
    bannerUrl: '/images/ad-hero.jpg',
  });

  const parsedFromBuiltBody = parseAdBody(body);
  assert.equal(parsedFromBuiltBody.recomShop, '추천 노출 설명');

  const parsedFromLegacyLabel = parseAdBody(body.replace('추천업체 노출', '추천업소 노출'));
  assert.equal(parsedFromLegacyLabel.recomShop, '추천 노출 설명');
});

test('AdCustomEditor syncs input values when body prop changes after async load/reset', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://example.com/admin/settings',
  });

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousNode = globalThis.Node;
  const previousEvent = globalThis.Event;
  const previousActEnvironment = (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;

  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    Node: { configurable: true, writable: true, value: dom.window.Node },
    Event: { configurable: true, writable: true, value: dom.window.Event },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
  });

  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);

  const initialBody = buildAdBody({
    phone: '1588-0000',
    email: 'ads@example.com',
    kakao: 'ad_help',
    hours: '평일 10:00 ~ 18:00',
    mainBanner: '초기 메인 배너',
    categoryAd: '초기 카테고리 광고',
    recomShop: '초기 추천업소',
    popupAd: '초기 팝업 광고',
    bannerUrl: '',
  });

  const loadedBody = buildAdBody({
    phone: '02-1234-5678',
    email: 'sales@example.com',
    kakao: 'loaded_channel',
    hours: '평일 11:00 ~ 20:00',
    mainBanner: '불러온 메인 배너',
    categoryAd: '불러온 카테고리 광고',
    recomShop: '불러온 추천업체 노출',
    popupAd: '불러온 팝업 광고',
    bannerUrl: '/images/loaded.jpg',
  });

  try {
    await act(async () => {
      root.render(
        React.createElement(AdCustomEditor, {
          body: initialBody,
          onChange: () => undefined,
          ipt: '',
          lbl: '',
        }),
      );
    });

    await act(async () => {
      root.render(
        React.createElement(AdCustomEditor, {
          body: loadedBody,
          onChange: () => undefined,
          ipt: '',
          lbl: '',
        }),
      );
    });

    const phoneInput = dom.window.document.querySelector('input[placeholder="예: 1588-0000"]');
    const emailInput = dom.window.document.querySelector('input[placeholder="예: ads@example.com"]');
    const recomTextarea = dom.window.document.querySelector('textarea[placeholder="추천업소 노출 설명을 입력하세요."]');

    assert.ok(phoneInput instanceof dom.window.HTMLInputElement);
    assert.ok(emailInput instanceof dom.window.HTMLInputElement);
    assert.ok(recomTextarea instanceof dom.window.HTMLTextAreaElement);

    assert.equal(phoneInput.value, '02-1234-5678');
    assert.equal(emailInput.value, 'sales@example.com');
    assert.equal(recomTextarea.value, '불러온 추천업체 노출');
  } finally {
    await act(async () => {
      root.unmount();
    });
    Object.defineProperties(globalThis, {
      window: { configurable: true, writable: true, value: previousWindow },
      document: { configurable: true, writable: true, value: previousDocument },
      navigator: { configurable: true, writable: true, value: previousNavigator },
      HTMLElement: { configurable: true, writable: true, value: previousHTMLElement },
      Node: { configurable: true, writable: true, value: previousNode },
      Event: { configurable: true, writable: true, value: previousEvent },
      IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: previousActEnvironment },
    });
    dom.window.close();
  }
});
