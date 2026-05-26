import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleLoginPost } from '@/app/api/auth/login/post';
import { handleOwnerRegisterPost } from '@/app/api/auth/register/owner/post';
import { handleUserRegisterPost } from '@/app/api/auth/register/user/post';

test('handleLoginPost forwards auth rate-limit headers on successful responses', async () => {
  const response = await handleLoginPost(
    new Request('https://example.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
      },
      body: JSON.stringify({ email: ' User@Example.com ', password: 'secret' }),
    }),
    {
      checkRateLimit: (request, routeKey, options) => {
        assert.equal(request.headers.get('x-forwarded-for'), '203.0.113.10');
        assert.equal(routeKey, 'auth:login');
        assert.equal(options?.credential, ' User@Example.com ');
        return {
          limited: false,
          headers: new Headers({
            'Cache-Control': 'no-store',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '9',
          }),
        };
      },
      login: async (input) => {
        assert.deepEqual(input, { email: ' User@Example.com ', password: 'secret' });
        return {
          token: 'session-token',
          user: { id: 'user-1', email: 'user@example.com' },
        };
      },
      setSessionCookie: async (token) => {
        assert.equal(token, 'session-token');
      },
    },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-RateLimit-Limit'), '10');
  assert.equal(response.headers.get('X-RateLimit-Remaining'), '9');
  assert.deepEqual(await response.json(), {
    user: { id: 'user-1', email: 'user@example.com' },
  });
});

test('handleUserRegisterPost forwards auth rate-limit headers on successful responses', async () => {
  const response = await handleUserRegisterPost(
    new Request('https://example.com/api/auth/register/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: '홍길동', email: 'user@example.com', password: 'secret123' }),
    }),
    {
      checkRateLimit: () => ({
        limited: false,
        headers: new Headers({
          'Cache-Control': 'no-store',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '8',
        }),
      }),
      registerUser: async (input) => ({ id: 'user-1', ...input }),
    },
  );

  assert.equal(response.status, 201);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-RateLimit-Limit'), '10');
  assert.equal(response.headers.get('X-RateLimit-Remaining'), '8');
  assert.deepEqual(await response.json(), {
    user: {
      id: 'user-1',
      name: '홍길동',
      email: 'user@example.com',
      password: 'secret123',
    },
  });
});

test('handleOwnerRegisterPost forwards auth rate-limit headers on successful responses', async () => {
  const response = await handleOwnerRegisterPost(
    new Request('https://example.com/api/auth/register/owner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '업주',
        email: 'owner@example.com',
        password: 'secret123',
        businessName: '테스트샵',
        businessNumber: '123-45-67890',
        phone: '010-1234-5678',
      }),
    }),
    {
      checkRateLimit: () => ({
        limited: false,
        headers: new Headers({
          'Cache-Control': 'no-store',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '7',
        }),
      }),
      registerOwnerRoute: async () =>
        Response.json(
          {
            user: { id: 'owner-1', email: 'owner@example.com' },
            requiresApproval: true,
            nextUrl: '/auth/login?notice=pending-approval',
            message: '관리자 승인 후 로그인할 수 있습니다.',
          },
          { status: 201 },
        ),
      registerOwner: async () => ({ id: 'owner-1' }),
    },
  );

  assert.equal(response.status, 201);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-RateLimit-Limit'), '10');
  assert.equal(response.headers.get('X-RateLimit-Remaining'), '7');
  assert.deepEqual(await response.json(), {
    user: { id: 'owner-1', email: 'owner@example.com' },
    requiresApproval: true,
    nextUrl: '/auth/login?notice=pending-approval',
    message: '관리자 승인 후 로그인할 수 있습니다.',
  });
});
