import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import ApprovalsPageClient from '@/components/admin/ApprovalsPageClient';
import type { User } from '@/lib/types';

const basePendingUser: User = {
  id: 'owner-1',
  name: '홍길동',
  email: 'owner1@example.com',
  role: 'OWNER',
  status: 'pending',
  businessName: '테스트 업소 1',
  businessNumber: '123-45-67890',
  phone: '010-1111-2222',
  createdAt: '2026-05-16T00:00:00.000Z',
  updatedAt: '2026-05-16T00:00:00.000Z',
};

function buildPendingUser(overrides: Partial<User>): User {
  return {
    ...basePendingUser,
    ...overrides,
  };
}

async function renderHarness(options?: {
  pendingUsers?: User[];
  processedUsers?: User[];
  fetchImpl?: typeof fetch;
}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: 'https://example.com/admin/approvals',
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

  const pendingUsers = options?.pendingUsers ?? [basePendingUser];
  const processedUsers = options?.processedUsers ?? [];
  const fetchCalls: Array<{ url: string; method: string }> = [];
  const fetchImpl = options?.fetchImpl ?? (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const userId = url.includes('/owner-2/') ? 'owner-2' : 'owner-1';
    const status = url.endsWith('/approve') ? 'approved' : 'rejected';

    return Response.json({ user: buildPendingUser({ id: userId, status }) }, { status: 200 });
  });

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    fetchCalls.push({ url, method });
    return fetchImpl(input, init);
  }) as typeof fetch;

  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(ApprovalsPageClient, { initialData: { pendingUsers, processedUsers } }));
  });

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  return {
    dom,
    fetchCalls,
    getButtonsByText(text: string) {
      return Array.from(dom.window.document.querySelectorAll('button')).filter((node) => node.textContent?.includes(text)) as HTMLButtonElement[];
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

test('renders initial approvals without issuing a list fetch after mount', async () => {
  const harness = await renderHarness({
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      throw new Error(`unexpected fetch ${(init?.method ?? 'GET')} ${String(input)}`);
    }) as typeof fetch,
  });

  try {
    assert.match(harness.dom.window.document.body.textContent ?? '', /테스트 업소 1/);
    assert.equal(harness.fetchCalls.filter((call) => call.method === 'GET').length, 0);
  } finally {
    await harness.cleanup();
  }
});

test('rapid duplicate approval clicks trigger only one approve request for the same row', async () => {
  const harness = await renderHarness();

  try {
    const approveButton = harness.getButtonsByText('가입승인')[0];
    assert.ok(approveButton);

    await act(async () => {
      approveButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      approveButton.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    const approveCalls = harness.fetchCalls.filter((call) => call.method === 'PATCH' && call.url.endsWith('/approve'));
    assert.equal(approveCalls.length, 1);
  } finally {
    await harness.cleanup();
  }
});

test('while one approval row is pending another row can still be rejected independently', async () => {
  let resolveApprove: (() => void) | null = null;
  let resolveReject: (() => void) | null = null;

  const harness = await renderHarness({
    pendingUsers: [buildPendingUser({ id: 'owner-1' }), buildPendingUser({ id: 'owner-2', businessName: '테스트 업소 2', email: 'owner2@example.com' })],
    fetchImpl: (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/owner-1/approve')) {
        await new Promise<void>((resolve) => {
          resolveApprove = resolve;
        });
        return Response.json({ user: buildPendingUser({ id: 'owner-1', status: 'approved' }) }, { status: 200 });
      }

      if (url.endsWith('/owner-2/reject')) {
        await new Promise<void>((resolve) => {
          resolveReject = resolve;
        });
        return Response.json({ user: buildPendingUser({ id: 'owner-2', status: 'rejected' }) }, { status: 200 });
      }

      throw new Error(`unexpected fetch PATCH ${url}`);
    }) as typeof fetch,
  });

  try {
    const approveButtons = harness.getButtonsByText('가입승인');
    const rejectButtons = harness.getButtonsByText('반려');
    assert.equal(approveButtons.length, 2);
    assert.equal(rejectButtons.length, 2);

    await act(async () => {
      approveButtons[0].dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    assert.equal(approveButtons[0].disabled, true);
    assert.equal(rejectButtons[0].disabled, true);
    assert.equal(approveButtons[1].disabled, false);
    assert.equal(rejectButtons[1].disabled, false);

    await act(async () => {
      rejectButtons[1].dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    assert.equal(approveButtons[0].disabled, true);
    assert.equal(rejectButtons[0].disabled, true);
    assert.equal(approveButtons[1].disabled, true);
    assert.equal(rejectButtons[1].disabled, true);

    resolveReject?.();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    assert.equal(approveButtons[0].disabled, true);
    assert.equal(rejectButtons[0].disabled, true);

    resolveApprove?.();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const approveCalls = harness.fetchCalls.filter((call) => call.url.endsWith('/owner-1/approve'));
    const rejectCalls = harness.fetchCalls.filter((call) => call.url.endsWith('/owner-2/reject'));
    assert.equal(approveCalls.length, 1);
    assert.equal(rejectCalls.length, 1);
  } finally {
    resolveApprove?.();
    resolveReject?.();
    await harness.cleanup();
  }
});
