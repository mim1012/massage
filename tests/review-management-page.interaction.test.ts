import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import ReviewManagementPage from '@/components/admin/ReviewManagementPage';
import type { Review } from '@/lib/types';

type ManagedReview = Review & { shopRegionLabel?: string };

const baseReview: ManagedReview = {
  id: 'review-1',
  shopId: 'shop-1',
  authorName: '손님1',
  shopName: '테스트 업소',
  content: '정말 좋았어요',
  rating: 5,
  createdAt: '2026-05-16T00:00:00.000Z',
};

function buildReview(overrides: Partial<ManagedReview>): ManagedReview {
  return {
    ...baseReview,
    ...overrides,
  };
}

async function renderHarness(options?: {
  reviews?: ManagedReview[];
  fetchImpl?: typeof fetch;
}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://example.com/admin/reviews',
  });

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousNode = globalThis.Node;
  const previousEvent = globalThis.Event;
  const previousMouseEvent = globalThis.MouseEvent;
  const previousFetch = globalThis.fetch;
  const previousConfirm = globalThis.confirm;
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
    confirm: { configurable: true, writable: true, value: () => true },
  });

  dom.window.confirm = () => true;

  const fetchCalls: Array<{ url: string; method: string; body?: string }> = [];
  globalThis.fetch = (options?.fetchImpl ?? (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? init.body : undefined,
    });

    return new Response(null, { status: 204 });
  })) as typeof fetch;

  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(ReviewManagementPage, {
      scope: 'admin',
      initialDataLoaded: true,
      initialReviews: options?.reviews ?? [baseReview],
    }));
  });

  return {
    dom,
    fetchCalls,
    getDeleteButtons() {
      return Array.from(dom.window.document.querySelectorAll('button')).filter(
        (button): button is HTMLButtonElement => button.getAttribute('title') === '삭제',
      );
    },
    getEditButtons() {
      return Array.from(dom.window.document.querySelectorAll('button')).filter(
        (button): button is HTMLButtonElement => button.getAttribute('title') === '수정',
      );
    },
    getCreateButton() {
      return Array.from(dom.window.document.querySelectorAll('button')).find(
        (button): button is HTMLButtonElement => button.textContent?.includes('리뷰 등록') ?? false,
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
        confirm: { configurable: true, writable: true, value: previousConfirm },
      });
      dom.window.close();
    },
  };
}

test('rapid duplicate review delete clicks trigger only one delete request for the same row', async () => {
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

test('deleting one review keeps the first row disabled while another row delete starts', async () => {
  let releaseFirstDelete: (() => void) | null = null;
  let releaseSecondDelete: (() => void) | null = null;
  const fetchCalls: Array<{ url: string; method: string }> = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    fetchCalls.push({
      url,
      method: init?.method ?? 'GET',
    });

    if (url.endsWith('/review-1')) {
      await new Promise<void>((resolve) => {
        releaseFirstDelete = resolve;
      });
    }

    if (url.endsWith('/review-2')) {
      await new Promise<void>((resolve) => {
        releaseSecondDelete = resolve;
      });
    }

    return new Response(null, { status: 204 });
  }) as typeof fetch;

  const harness = await renderHarness({
    reviews: [
      buildReview({ id: 'review-1', content: '첫 번째 리뷰' }),
      buildReview({ id: 'review-2', shopId: 'shop-2', authorName: '손님2', content: '두 번째 리뷰' }),
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

test('review edit modal pre-fills existing review fields', async () => {
  const harness = await renderHarness();

  try {
    const editButton = harness.getEditButtons()[0];
    assert.ok(editButton, 'edit button should be rendered');

    await act(async () => {
      editButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    const modalTitle = Array.from(harness.dom.window.document.querySelectorAll('h2')).find((heading) =>
      heading.textContent?.includes('리뷰 수정'),
    );
    assert.ok(modalTitle, 'edit modal should be rendered');

    const inputs = Array.from(harness.dom.window.document.querySelectorAll('input')) as HTMLInputElement[];
    const authorInput = inputs.find((input) => input.value === '손님1');
    assert.ok(authorInput, 'author input should be prefilled');

    const readonlyShopInput = inputs.find((input) => input.value === '테스트 업소');
    assert.ok(readonlyShopInput, 'shop input should be readonly and prefilled');

    const textareas = Array.from(harness.dom.window.document.querySelectorAll('textarea')) as HTMLTextAreaElement[];
    const contentInput = textareas[0];
    assert.equal(contentInput.value, '정말 좋았어요');
  } finally {
    await harness.cleanup();
  }
});
