import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import AdminPartnershipsPage from '@/app/admin/partnerships/page';
import type { PartnershipInquiry } from '@/lib/types';

const baseInquiry: PartnershipInquiry = {
  id: 'inquiry-1',
  shopName: '테스트 업체',
  region: '서울',
  subRegion: '강남',
  theme: '스웨디시',
  contactName: '홍길동',
  phone: '010-1111-2222',
  kakaoId: 'kakao-test',
  message: '입점 문의 내용',
  status: 'pending',
  createdAt: '2026-05-16T00:00:00.000Z',
};

async function renderHarness(options?: {
  inquiries?: PartnershipInquiry[];
  fetchImpl?: typeof fetch;
}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: 'https://example.com/admin/partnerships',
  });

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousNode = globalThis.Node;
  const previousEvent = globalThis.Event;
  const previousMouseEvent = globalThis.MouseEvent;
  const previousFetch = globalThis.fetch;
  const previousActEnvironment = (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;

  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    Node: { configurable: true, writable: true, value: dom.window.Node },
    Event: { configurable: true, writable: true, value: dom.window.Event },
    MouseEvent: { configurable: true, writable: true, value: dom.window.MouseEvent },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
  });

  const fetchCalls: Array<{ url: string; method: string; body?: string }> = [];
  globalThis.fetch = (options?.fetchImpl ?? (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    fetchCalls.push({ url, method, body: typeof init?.body === 'string' ? init.body : undefined });

    if (url.endsWith('/api/admin/partnerships') && method === 'GET') {
      return Response.json({ inquiries: options?.inquiries ?? [baseInquiry] }, { status: 200 });
    }

    return method === 'PATCH' ? Response.json({}, { status: 200 }) : new Response(null, { status: 204 });
  })) as typeof fetch;

  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(AdminPartnershipsPage));
  });

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  return {
    dom,
    fetchCalls,
    getButtonByText(text: string) {
      const button = Array.from(dom.window.document.querySelectorAll('button')).find((node) => node.textContent?.includes(text));
      assert.ok(button, `button with text ${text} should exist`);
      return button as HTMLButtonElement;
    },
    getButtonByTitle(title: string) {
      const button = Array.from(dom.window.document.querySelectorAll('button')).find((node) => node.getAttribute('title') === title);
      assert.ok(button, `button with title ${title} should exist`);
      return button as HTMLButtonElement;
    },
    async openDetail() {
      await act(async () => {
        this.getButtonByTitle('상세 보기').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
        await Promise.resolve();
      });
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
        IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: previousActEnvironment },
      });
      dom.window.close();
    },
  };
}

test('rapid duplicate partnership delete clicks trigger only one delete request', async () => {
  const harness = await renderHarness();

  try {
    await harness.openDetail();
    const deleteButton = harness.getButtonByText('내역 삭제');

    await act(async () => {
      deleteButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      deleteButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    const deleteCalls = harness.fetchCalls.filter((call) => call.method === 'DELETE');
    assert.equal(deleteCalls.length, 1);
  } finally {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await harness.cleanup();
  }
});

test('rapid duplicate partnership status clicks trigger only one patch request', async () => {
  const harness = await renderHarness();

  try {
    await harness.openDetail();
    const statusButton = harness.getButtonByText('상담중');

    await act(async () => {
      statusButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      statusButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    const patchCalls = harness.fetchCalls.filter((call) => call.method === 'PATCH');
    assert.equal(patchCalls.length, 1);
    assert.equal(patchCalls[0]?.body, JSON.stringify({ status: 'contacted' }));
  } finally {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await harness.cleanup();
  }
});
