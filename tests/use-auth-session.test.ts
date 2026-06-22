import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useAuthSession } from '@/lib/use-auth-session';

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

async function renderHarness(fetchImpl: typeof fetch) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: 'https://example.com/',
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

  globalThis.fetch = fetchImpl;

  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(SessionHarness));
  });

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

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
