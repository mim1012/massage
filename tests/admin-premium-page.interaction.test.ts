import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import PremiumManagementPage from '@/app/admin/premium/page';

async function renderHarness(options?: {
  fetchImpl?: typeof fetch;
}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: 'https://example.com/admin/premium',
  });

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousNode = globalThis.Node;
  const previousEvent = globalThis.Event;
  const previousMouseEvent = globalThis.MouseEvent;
  const previousFetch = globalThis.fetch;
  const previousSetTimeout = globalThis.setTimeout;
  const previousClearTimeout = globalThis.clearTimeout;
  const previousActEnvironment = (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;

  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    Node: { configurable: true, writable: true, value: dom.window.Node },
    Event: { configurable: true, writable: true, value: dom.window.Event },
    MouseEvent: { configurable: true, writable: true, value: dom.window.MouseEvent },
    setTimeout: { configurable: true, writable: true, value: (() => 0) as typeof setTimeout },
    clearTimeout: { configurable: true, writable: true, value: (() => {}) as typeof clearTimeout },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
  });

  const fetchCalls: Array<{ url: string; method: string; body?: string }> = [];
  const fetchImpl = options?.fetchImpl ?? (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';

    if (url.includes('/api/admin/shops?region=seoul') && method === 'GET') {
      return Response.json({
        shops: [
          {
            id: 'shop-1',
            name: '프리미엄 업소 1',
            regionLabel: '서울',
            subRegionLabel: '강남',
            isPremium: true,
            premiumOrder: 1,
          },
          {
            id: 'shop-2',
            name: '일반 업소 2',
            regionLabel: '서울',
            subRegionLabel: '서초',
            isPremium: false,
            premiumOrder: undefined,
          },
        ],
      }, { status: 200 });
    }

    if (url.endsWith('/shop-1/premium') && method === 'PATCH') {
      return Response.json({ ok: true }, { status: 200 });
    }

    throw new Error(`unexpected fetch ${method} ${url}`);
  });

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    fetchCalls.push({ url, method, body: typeof init?.body === 'string' ? init.body : undefined });
    return fetchImpl(input, init);
  }) as typeof fetch;

  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(PremiumManagementPage));
  });

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });

  return {
    dom,
    fetchCalls,
    getSaveButton() {
      return Array.from(dom.window.document.querySelectorAll('button')).find((node) => node.textContent?.includes('배너 설정 저장')) as HTMLButtonElement | undefined;
    },
    async cleanup() {
      await act(async () => {
        root.unmount();
      });
      globalThis.fetch = previousFetch;
      Object.defineProperties(globalThis, {
        window: { configurable: true, writable: true, value: previousWindow },
        document: { configurable: true, writable: true, value: previousDocument },
        navigator: { configurable: true, writable: true, value: previousNavigator },
        HTMLElement: { configurable: true, writable: true, value: previousHTMLElement },
        Node: { configurable: true, writable: true, value: previousNode },
        Event: { configurable: true, writable: true, value: previousEvent },
        MouseEvent: { configurable: true, writable: true, value: previousMouseEvent },
        setTimeout: { configurable: true, writable: true, value: previousSetTimeout },
        clearTimeout: { configurable: true, writable: true, value: previousClearTimeout },
        IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: previousActEnvironment },
      });
      dom.window.close();
    },
  };
}

test('rapid duplicate save clicks trigger only one premium save sequence', async () => {
  const harness = await renderHarness();

  try {
    harness.fetchCalls.length = 0;
    const saveButton = harness.getSaveButton();
    assert.ok(saveButton);

    await act(async () => {
      saveButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      saveButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    const saveLoadCalls = harness.fetchCalls.filter((call) => call.method === 'GET' && call.url.includes('/api/admin/shops?region=seoul'));
    const premiumPatchCalls = harness.fetchCalls.filter((call) => call.method === 'PATCH' && call.url.endsWith('/shop-1/premium'));

    assert.equal(saveLoadCalls.length, 1);
    assert.equal(premiumPatchCalls.length, 2);
  } finally {
    await harness.cleanup();
  }
});
