import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { AUTH_SESSION_STORAGE_KEY, useAuthSession } from '@/lib/use-auth-session';

function SessionHarness() {
  const { user, authChecked, refetch } = useAuthSession();

  return React.createElement(
    'div',
    null,
    React.createElement('div', { id: 'status' }, `${authChecked ? 'checked' : 'pending'}:${user?.email ?? 'guest'}`),
    React.createElement(
      'button',
      { type: 'button', onClick: () => void refetch() },
      'refetch',
    ),
  );
}

function DualSessionHarness() {
  const primary = useAuthSession();
  const secondary = useAuthSession();

  return React.createElement(
    'div',
    null,
    React.createElement('div', { id: 'primary-status' }, `${primary.authChecked ? 'checked' : 'pending'}:${primary.user?.email ?? 'guest'}`),
    React.createElement('div', { id: 'secondary-status' }, `${secondary.authChecked ? 'checked' : 'pending'}:${secondary.user?.email ?? 'guest'}`),
  );
}

function DeferredSessionHarness() {
  const { user, authChecked } = useAuthSession({ defer: true });

  return React.createElement(
    'div',
    { id: 'deferred-status' },
    `${authChecked ? 'checked' : 'pending'}:${user?.email ?? 'guest'}`,
  );
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function renderHarness(fetchImpl: typeof fetch, setupWindow?: (window: Window) => void, component: React.ReactNode = React.createElement(SessionHarness)) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: 'https://example.com/',
  });

  setupWindow?.(dom.window as unknown as Window);

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

  globalThis.fetch = fetchImpl;

  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(component);
  });

  await flush();

  return {
    dom,
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

test('useAuthSession hydrates immediately from the stored session snapshot', async () => {
  let resolveFetch: ((value: Response) => void) | null = null;
  const fetchCalls: string[] = [];
  const fetchImpl = (async (input: RequestInfo | URL) => {
    fetchCalls.push(String(input));
    return await new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
  }) as typeof fetch;

  const harness = await renderHarness(fetchImpl, (window) => {
    window.sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({ id: 'user-1', email: 'qa-prod-user@massage.co.kr', name: 'QA', role: 'USER' }),
    );
  });

  try {
    assert.equal(harness.dom.window.document.getElementById('status')?.textContent, 'checked:qa-prod-user@massage.co.kr');
    assert.equal(fetchCalls.length, 1);

    resolveFetch?.(Response.json({ user: { id: 'user-1', email: 'qa-prod-user@massage.co.kr', name: 'QA', role: 'USER' } }, { status: 200 }));
    await flush();

    assert.equal(harness.dom.window.document.getElementById('status')?.textContent, 'checked:qa-prod-user@massage.co.kr');
  } finally {
    await harness.cleanup();
  }
});

test('useAuthSession preserves the current user when a refetch hits a transient server error', async () => {
  let callCount = 0;
  const harness = await renderHarness((async () => {
    callCount += 1;
    if (callCount === 1) {
      return Response.json({ user: { id: 'user-1', email: 'qa-prod-user@massage.co.kr', name: 'QA', role: 'USER' } }, { status: 200 });
    }

    return Response.json({ error: 'temporary failure' }, { status: 503 });
  }) as typeof fetch);

  try {
    assert.equal(harness.dom.window.document.getElementById('status')?.textContent, 'checked:qa-prod-user@massage.co.kr');

    const button = harness.dom.window.document.querySelector('button');
    assert.ok(button);

    await act(async () => {
      button.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    assert.equal(harness.dom.window.document.getElementById('status')?.textContent, 'checked:qa-prod-user@massage.co.kr');
    assert.equal(callCount, 2);
  } finally {
    await harness.cleanup();
  }
});

test('useAuthSession shares one in-flight session request across multiple consumers', async () => {
  let callCount = 0;
  let resolveFetch: ((value: Response) => void) | null = null;
  const harness = await renderHarness(
    (async () => {
      callCount += 1;
      return await new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });
    }) as typeof fetch,
    undefined,
    React.createElement(DualSessionHarness),
  );

  try {
    assert.equal(callCount, 1);
    assert.equal(harness.dom.window.document.getElementById('primary-status')?.textContent, 'pending:guest');
    assert.equal(harness.dom.window.document.getElementById('secondary-status')?.textContent, 'pending:guest');

    resolveFetch?.(Response.json({ user: { id: 'user-1', email: 'qa-prod-user@massage.co.kr', name: 'QA', role: 'USER' } }, { status: 200 }));
    await flush();

    assert.equal(harness.dom.window.document.getElementById('primary-status')?.textContent, 'checked:qa-prod-user@massage.co.kr');
    assert.equal(harness.dom.window.document.getElementById('secondary-status')?.textContent, 'checked:qa-prod-user@massage.co.kr');
    assert.equal(callCount, 1);
  } finally {
    await harness.cleanup();
  }
});

test('useAuthSession defers the initial session request when requested', async () => {
  let callCount = 0;
  const harness = await renderHarness(
    (async () => {
      callCount += 1;
      return Response.json({ user: null }, { status: 200 });
    }) as typeof fetch,
    undefined,
    React.createElement(DeferredSessionHarness),
  );

  try {
    assert.equal(harness.dom.window.document.getElementById('deferred-status')?.textContent, 'pending:guest');
    assert.equal(callCount, 0);
  } finally {
    await harness.cleanup();
  }
});
