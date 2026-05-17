import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import RegisterOwnerPage from '@/app/auth/register-owner/page';

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

test('register owner page shows approval-needed success state after a successful submit', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://example.com/auth/register-owner',
  });
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousNode = globalThis.Node;
  const previousEvent = globalThis.Event;
  const previousMouseEvent = globalThis.MouseEvent;
  const previousSubmitEvent = (globalThis as typeof globalThis & { SubmitEvent?: typeof SubmitEvent }).SubmitEvent;
  const previousFetch = globalThis.fetch;
  const previousSelf = (globalThis as typeof globalThis & { self?: Window & typeof globalThis }).self;
  const previousActEnvironment = (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;

  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    Node: { configurable: true, writable: true, value: dom.window.Node },
    Event: { configurable: true, writable: true, value: dom.window.Event },
    MouseEvent: { configurable: true, writable: true, value: dom.window.MouseEvent },
    SubmitEvent: { configurable: true, writable: true, value: dom.window.SubmitEvent },
  });

  (globalThis as typeof globalThis & { self?: Window & typeof globalThis }).self = dom.window as Window & typeof globalThis;
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

  const fetchCalls: Array<{ url: string; body: Record<string, unknown> }> = [];
  globalThis.fetch = async (input, init) => {
    fetchCalls.push({
      url: String(input),
      body: JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>,
    });

    return new Response(
      JSON.stringify({
        message: '관리자 승인 후 로그인할 수 있습니다.',
        nextUrl: '/auth/login',
        requiresApproval: true,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  };

  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(React.createElement(RegisterOwnerPage));
    });

    const setValue = (name: string, value: string) => {
      const input = container.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
      assert.ok(input, `expected input ${name}`);
      const descriptor = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value');
      assert.ok(descriptor?.set, 'expected HTMLInputElement value setter');
      act(() => {
        descriptor.set?.call(input, value);
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      });
    };

    setValue('id', 'owner@example.com');
    setValue('password', 'secret1234');
    setValue('passwordConfirm', 'secret1234');
    setValue('name', '홍길동');
    setValue('businessName', '강남 힐링스파');
    setValue('businessNumber', '123-45-67890');
    setValue('phone', '010-1234-5678');

    const form = container.querySelector('form');
    assert.ok(form, 'expected register form');

    await act(async () => {
      form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
      await flush();
    });

    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0]?.url, '/api/auth/register/owner');

    assert.match(container.textContent ?? '', /입점 신청이 접수되었습니다/);
    assert.match(container.textContent ?? '', /관리자 승인 후 로그인할 수 있습니다/);
    assert.equal(container.querySelector('form'), null);
    const loginLink = Array.from(container.querySelectorAll('a')).find((anchor) => anchor.getAttribute('href') === '/auth/login');
    assert.ok(loginLink, 'expected login link in success state');
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
      SubmitEvent: { configurable: true, writable: true, value: previousSubmitEvent },
    });
    (globalThis as typeof globalThis & { self?: Window & typeof globalThis }).self = previousSelf;
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    dom.window.close();
  }
});
