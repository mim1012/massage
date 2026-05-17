import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import QnaManagementPage from '@/components/admin/QnaManagementPage';
import type { QnA } from '@/lib/types';

const baseQna: QnA = {
  id: 'qna-1',
  question: '예약 가능한가요?',
  authorName: '손님1',
  isAnswered: false,
  commentCount: 0,
  comments: [],
  createdAt: '2026-05-16T00:00:00.000Z',
};

test('rapid duplicate delete clicks trigger only one delete request for the same row', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://example.com/admin/qna',
  });

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousNode = globalThis.Node;
  const previousEvent = globalThis.Event;
  const previousMouseEvent = globalThis.MouseEvent;
  const previousConfirm = globalThis.confirm;
  const previousFetch = globalThis.fetch;
  const previousActEnvironment = (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;

  const confirmStub = () => true;
  dom.window.confirm = confirmStub;

  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    Node: { configurable: true, writable: true, value: dom.window.Node },
    Event: { configurable: true, writable: true, value: dom.window.Event },
    MouseEvent: { configurable: true, writable: true, value: dom.window.MouseEvent },
    confirm: { configurable: true, writable: true, value: confirmStub },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
  });

  const fetchCalls: Array<{ url: string; method: string }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({
      url: String(input),
      method: init?.method ?? 'GET',
    });

    return new Response(null, { status: 204 });
  }) as typeof fetch;

  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(React.createElement(QnaManagementPage, {
        scope: 'admin',
        initialDataLoaded: true,
        initialQnaList: [baseQna],
        initialShops: [],
      }));
    });

    const deleteButton = Array.from(dom.window.document.querySelectorAll('button')).find((button) =>
      button.getAttribute('aria-label') === 'Q&A 삭제',
    );
    assert.ok(deleteButton, 'delete button should be rendered');

    await act(async () => {
      deleteButton.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      deleteButton.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    const deleteCalls = fetchCalls.filter((call) => call.method === 'DELETE');
    assert.equal(deleteCalls.length, 1);
  } finally {
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
      confirm: { configurable: true, writable: true, value: previousConfirm },
      IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: previousActEnvironment },
    });
    dom.window.close();
  }
});
