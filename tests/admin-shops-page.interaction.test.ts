import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import AdminShopsPageClient from '@/components/admin/AdminShopsPageClient';
import type { AdminShopListItem } from '@/lib/communityTypes';

const baseShop: AdminShopListItem = {
  id: 'shop-1',
  name: '테스트 업소 1',
  slug: 'shop-1',
  phone: '010-1111-2222',
  region: 'seoul',
  regionLabel: '서울',
  subRegionLabel: '강남',
  themeLabel: '스웨디시',
  isVisible: true,
  isPremium: false,
  premiumOrder: undefined,
  ownerId: 'owner-1',
  reviewCount: 0,
  createdAt: '2026-05-16T00:00:00.000Z',
  updatedAt: '2026-05-16T00:00:00.000Z',
};

function buildShop(overrides: Partial<AdminShopListItem>): AdminShopListItem {
  return {
    ...baseShop,
    ...overrides,
  };
}

async function renderHarness(options?: {
  shops?: AdminShopListItem[];
  fetchImpl?: typeof fetch;
}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: 'https://example.com/admin/shops',
  });

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousNode = globalThis.Node;
  const previousEvent = globalThis.Event;
  const previousMouseEvent = globalThis.MouseEvent;
  const previousFetch = globalThis.fetch;
  const previousAlert = globalThis.alert;
  const previousSelf = (globalThis as typeof globalThis & { self?: Window & typeof globalThis }).self;
  const previousRequestIdleCallback = (globalThis as typeof globalThis & { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback;
  const previousCancelIdleCallback = (globalThis as typeof globalThis & { cancelIdleCallback?: typeof cancelIdleCallback }).cancelIdleCallback;
  const previousActEnvironment = (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;

  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    Node: { configurable: true, writable: true, value: dom.window.Node },
    Event: { configurable: true, writable: true, value: dom.window.Event },
    MouseEvent: { configurable: true, writable: true, value: dom.window.MouseEvent },
    alert: { configurable: true, writable: true, value: () => {} },
    self: { configurable: true, writable: true, value: dom.window },
    requestIdleCallback: { configurable: true, writable: true, value: (callback: IdleRequestCallback) => setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline), 0) },
    cancelIdleCallback: { configurable: true, writable: true, value: (handle: number) => clearTimeout(handle) },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
  });

  const shops = options?.shops ?? [baseShop];
  const fetchCalls: Array<{ url: string; method: string; body?: string }> = [];
  const fetchImpl = options?.fetchImpl ?? (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const requestBody = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
    const shopId = url.includes('/shop-2/') ? 'shop-2' : 'shop-1';
    return Response.json({
      shop: buildShop({
        id: shopId,
        slug: shopId,
        name: shopId === 'shop-2' ? '테스트 업소 2' : '테스트 업소 1',
        phone: shopId === 'shop-2' ? '010-2222-3333' : '010-1111-2222',
        ownerId: shopId === 'shop-2' ? 'owner-2' : 'owner-1',
        isVisible: requestBody.isVisible ?? true,
        isPremium: requestBody.isPremium ?? false,
        premiumOrder: requestBody.premiumOrder,
      }),
    }, { status: 200 });
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
    root.render(React.createElement(AdminShopsPageClient, { initialShops: shops }));
  });

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  return {
    dom,
    fetchCalls,
    getVisibilityButtons() {
      return Array.from(dom.window.document.querySelectorAll('button[title*="노출"], button[title*="숨김"]')) as HTMLButtonElement[];
    },
    getPremiumButtons() {
      return Array.from(dom.window.document.querySelectorAll('button[title="AD 등록"], button[title="AD 해제"]')) as HTMLButtonElement[];
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
        alert: { configurable: true, writable: true, value: previousAlert },
        self: { configurable: true, writable: true, value: previousSelf },
        requestIdleCallback: { configurable: true, writable: true, value: previousRequestIdleCallback },
        cancelIdleCallback: { configurable: true, writable: true, value: previousCancelIdleCallback },
        IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: previousActEnvironment },
      });
      dom.window.close();
    },
  };
}

test('renders initial shops without issuing a list fetch after mount', async () => {
  const harness = await renderHarness({
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      throw new Error(`unexpected fetch ${method} ${String(input)}`);
    }) as typeof fetch,
  });

  try {
    assert.match(harness.dom.window.document.body.textContent ?? '', /테스트 업소 1/);
    const listFetchCalls = harness.fetchCalls.filter((call) => call.method === 'GET');
    assert.equal(listFetchCalls.length, 0);
  } finally {
    await harness.cleanup();
  }
});

test('rapid duplicate visibility clicks trigger only one patch request for the same row', async () => {
  const harness = await renderHarness();

  try {
    const visibilityButton = harness.getVisibilityButtons()[0];
    assert.ok(visibilityButton);

    await act(async () => {
      visibilityButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      visibilityButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    const visibilityCalls = harness.fetchCalls.filter((call) => call.method === 'PATCH' && call.url.endsWith('/visibility'));
    assert.equal(visibilityCalls.length, 1);
  } finally {
    await harness.cleanup();
  }
});

test('while one shop premium action is pending another row visibility action can still start', async () => {
  let resolvePremium: (() => void) | null = null;
  let resolveVisibility: (() => void) | null = null;
  const shops = [
    buildShop({ id: 'shop-1' }),
    buildShop({ id: 'shop-2', name: '테스트 업소 2', slug: 'shop-2', phone: '010-2222-3333', ownerId: 'owner-2' }),
  ];

  const harness = await renderHarness({
    shops,
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/shop-1/premium')) {
        await new Promise<void>((resolve) => {
          resolvePremium = resolve;
        });
        return Response.json({ shop: buildShop({ id: 'shop-1', isPremium: true, premiumOrder: 1 }) }, { status: 200 });
      }

      if (url.endsWith('/shop-2/visibility')) {
        await new Promise<void>((resolve) => {
          resolveVisibility = resolve;
        });
        return Response.json({ shop: buildShop({ id: 'shop-2', slug: 'shop-2', name: '테스트 업소 2', phone: '010-2222-3333', ownerId: 'owner-2', isVisible: false }) }, { status: 200 });
      }

      throw new Error(`unexpected fetch ${(init?.method ?? 'GET')} ${url}`);
    }) as typeof fetch,
  });

  try {
    const premiumButtons = harness.getPremiumButtons();
    const visibilityButtons = harness.getVisibilityButtons();
    assert.equal(premiumButtons.length, 2);
    assert.equal(visibilityButtons.length, 2);

    await act(async () => {
      premiumButtons[0].dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    assert.equal(premiumButtons[0].disabled, true);
    assert.equal(visibilityButtons[0].disabled, true);
    assert.equal(premiumButtons[1].disabled, false);
    assert.equal(visibilityButtons[1].disabled, false);

    await act(async () => {
      visibilityButtons[1].dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    assert.equal(premiumButtons[1].disabled, true);
    assert.equal(visibilityButtons[1].disabled, true);
    assert.equal(premiumButtons[0].disabled, true);
    assert.equal(visibilityButtons[0].disabled, true);

    resolveVisibility?.();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    assert.equal(premiumButtons[0].disabled, true);
    assert.equal(visibilityButtons[0].disabled, true);

    resolvePremium?.();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const premiumCalls = harness.fetchCalls.filter((call) => call.url.endsWith('/shop-1/premium'));
    const visibilityCalls = harness.fetchCalls.filter((call) => call.url.endsWith('/shop-2/visibility'));
    assert.equal(premiumCalls.length, 1);
    assert.equal(visibilityCalls.length, 1);
  } finally {
    resolvePremium?.();
    resolveVisibility?.();
    await harness.cleanup();
  }
});
