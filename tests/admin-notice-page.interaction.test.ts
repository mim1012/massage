import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import AdminNoticePage from '@/app/admin/notice/page';
import type { Notice } from '@/lib/types';

const baseNotice: Notice = {
  id: 'notice-1',
  title: '첫 번째 공지',
  content: '첫 번째 공지 내용',
  isPinned: false,
  createdAt: '2026-05-16T00:00:00.000Z',
};

function buildNotice(overrides: Partial<Notice>): Notice {
  return {
    ...baseNotice,
    ...overrides,
  };
}

async function renderHarness(options?: {
  notices?: Notice[];
  fetchImpl?: typeof fetch;
}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://example.com/admin/notice',
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

  const fetchCalls: Array<{ url: string; method: string }> = [];
  globalThis.fetch = (options?.fetchImpl ?? (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    fetchCalls.push({ url, method });

    if (url.endsWith('/api/admin/notices') && method === 'GET') {
      return Response.json({ notices: options?.notices ?? [baseNotice] }, { status: 200 });
    }

    return new Response(null, { status: 204 });
  })) as typeof fetch;

  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(AdminNoticePage));
  });

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  return {
    dom,
    fetchCalls,
    getDeleteButtons() {
      return Array.from(dom.window.document.querySelectorAll('button')).filter(
        (button): button is HTMLButtonElement => button.querySelector('svg') !== null && button.className.includes('text-red-500'),
      );
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

test('rapid duplicate notice delete clicks trigger only one delete request for the same row', async () => {
  const harness = await renderHarness();

  try {
    const deleteButton = harness.getDeleteButtons()[0];
    assert.ok(deleteButton, 'delete button should be rendered');

    await act(async () => {
      deleteButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      deleteButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    const deleteCalls = harness.fetchCalls.filter((call) => call.method === 'DELETE');
    assert.equal(deleteCalls.length, 1);
  } finally {
    await harness.cleanup();
  }
});

test('deleting one notice keeps that row disabled while another notice delete starts', async () => {
  let releaseFirstDelete: (() => void) | null = null;
  let releaseSecondDelete: (() => void) | null = null;
  const fetchCalls: Array<{ url: string; method: string }> = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    fetchCalls.push({ url, method });

    if (url.endsWith('/api/admin/notices') && method === 'GET') {
      return Response.json({
        notices: [
          buildNotice({ id: 'notice-1', title: '첫 번째 공지' }),
          buildNotice({ id: 'notice-2', title: '두 번째 공지', content: '두 번째 공지 내용' }),
        ],
      }, { status: 200 });
    }

    if (url.endsWith('/notice-1')) {
      await new Promise<void>((resolve) => {
        releaseFirstDelete = resolve;
      });
    }

    if (url.endsWith('/notice-2')) {
      await new Promise<void>((resolve) => {
        releaseSecondDelete = resolve;
      });
    }

    return new Response(null, { status: 204 });
  }) as typeof fetch;

  const harness = await renderHarness({ fetchImpl });

  try {
    const deleteButtons = harness.getDeleteButtons();
    assert.equal(deleteButtons.length, 2);

    await act(async () => {
      deleteButtons[0].dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    assert.equal(deleteButtons[0].disabled, true);
    assert.equal(deleteButtons[1].disabled, false);

    await act(async () => {
      deleteButtons[1].dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    assert.equal(deleteButtons[0].disabled, true);
    assert.equal(deleteButtons[1].disabled, true);

    releaseSecondDelete?.();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    assert.equal(deleteButtons[0].disabled, true);

    const deleteCalls = fetchCalls.filter((call) => call.method === 'DELETE');
    assert.equal(deleteCalls.length, 2);
  } finally {
    releaseFirstDelete?.();
    releaseSecondDelete?.();
    await harness.cleanup();
  }
});
