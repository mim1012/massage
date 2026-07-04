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

function buildQna(overrides: Partial<QnA>): QnA {
  return {
    ...baseQna,
    ...overrides,
  };
}

async function renderHarness(options?: {
  confirm?: () => boolean;
  qnaList?: QnA[];
  fetchImpl?: typeof fetch;
  scope?: 'admin' | 'owner';
}) {
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

  const confirmStub = options?.confirm ?? (() => true);
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
  globalThis.fetch = (options?.fetchImpl ?? (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({
      url: String(input),
      method: init?.method ?? 'GET',
    });

    return new Response(null, { status: 204 });
  })) as typeof fetch;

  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(QnaManagementPage, {
      scope: options?.scope ?? 'admin',
      initialDataLoaded: true,
      initialQnaList: options?.qnaList ?? [baseQna],
      initialShops: [],
    }));
  });

  return {
    dom,
    fetchCalls,
    getDeleteButtons() {
      return Array.from(dom.window.document.querySelectorAll('button')).filter(
        (button): button is HTMLButtonElement => button.getAttribute('aria-label') === 'Q&A 삭제',
      );
    },
    getCommentButtons() {
      return Array.from(dom.window.document.querySelectorAll('button')).filter(
        (button): button is HTMLButtonElement => button.textContent?.trim() === '댓글 추가',
      );
    },
    getSaveButtons() {
      return Array.from(dom.window.document.querySelectorAll('button')).filter(
        (button): button is HTMLButtonElement => button.textContent?.trim() === '저장' || button.textContent?.trim() === '저장 중',
      );
    },
    getTextareas() {
      return Array.from(dom.window.document.querySelectorAll('textarea')) as HTMLTextAreaElement[];
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
        confirm: { configurable: true, writable: true, value: previousConfirm },
        IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: previousActEnvironment },
      });
      dom.window.close();
    },
  };
}

test('rapid duplicate delete clicks trigger only one delete request for the same row', async () => {
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

test('canceling delete confirmation does not fire a delete request', async () => {
  const harness = await renderHarness({
    confirm: () => false,
  });

  try {
    const deleteButton = harness.getDeleteButtons()[0];
    assert.ok(deleteButton, 'delete button should be rendered');

    await act(async () => {
      deleteButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    const deleteCalls = harness.fetchCalls.filter((call) => call.method === 'DELETE');
    assert.equal(deleteCalls.length, 0);
  } finally {
    await harness.cleanup();
  }
});

test('owner qna management keeps delete actions wired for owned customer questions', async () => {
  const harness = await renderHarness({
    scope: 'owner',
  });

  try {
    const deleteButton = harness.getDeleteButtons()[0];
    assert.ok(deleteButton, 'delete button should remain rendered for owner scope');
    assert.equal(harness.getCommentButtons().length, 1);

    await act(async () => {
      deleteButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    const deleteCalls = harness.fetchCalls.filter((call) => call.method === 'DELETE');
    assert.equal(deleteCalls.length, 1);
    assert.equal(deleteCalls[0]?.url, '/api/admin/qna/qna-1');
  } finally {
    await harness.cleanup();
  }
});

test('deleting one row keeps another row delete action enabled', async () => {
  let releaseFirstDelete: (() => void) | null = null;
  const fetchCalls: Array<{ url: string; method: string }> = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({
      url: String(input),
      method: init?.method ?? 'GET',
    });

    if (String(input).endsWith('/qna-1')) {
      await new Promise<void>((resolve) => {
        releaseFirstDelete = resolve;
      });
    }

    return new Response(null, { status: 204 });
  }) as typeof fetch;

  const harness = await renderHarness({
    qnaList: [
      buildQna({ id: 'qna-1', question: '첫 번째 질문' }),
      buildQna({ id: 'qna-2', question: '두 번째 질문', authorName: '손님2' }),
    ],
    fetchImpl,
  });

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

    const deleteCallsBeforeRelease = fetchCalls.filter((call) => call.method === 'DELETE');
    assert.equal(deleteCallsBeforeRelease.length, 2);

    releaseFirstDelete?.();
    await act(async () => {
      await Promise.resolve();
    });
  } finally {
    releaseFirstDelete?.();
    await harness.cleanup();
  }
});
