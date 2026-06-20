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
          user: { id: 'user-1', email: 'user@example.com', role: 'USER' },
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
    user: { id: 'user-1', email: 'user@example.com', role: 'USER' },
  });
});
test('handleLoginPost rejects owners that are not approved without setting a session cookie', async () => {
  const response = await handleLoginPost(
    new Request('https://example.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'pending-owner@example.com', password: 'secret' }),
    }),
    {
      checkRateLimit: () => ({
        limited: false,
        headers: new Headers({
          'Cache-Control': 'no-store',
        }),
      }),
      login: async () => {
        throw new Error('OWNER_NOT_APPROVED');
      },
      setSessionCookie: async () => {
        throw new Error('setSessionCookie should not be called');
      },
    },
  );

  assert.equal(response.status, 403);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { error: '업주 계정은 관리자 승인 후 로그인할 수 있습니다.' });
});
test('handleLoginPost rejects approved owners from the general user login audience', async () => {
  let cookieSet = false;
  const response = await handleLoginPost(
    new Request('https://example.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'owner@example.com', password: 'secret', audience: 'user' }),
    }),
    {
      checkRateLimit: () => ({
        limited: false,
        headers: new Headers({
          'Cache-Control': 'no-store',
        }),
      }),
      login: async () => ({
        token: 'owner-token',
        user: { id: 'owner-1', email: 'owner@example.com', role: 'OWNER' },
      }),
      setSessionCookie: async () => {
        cookieSet = true;
      },
    },
  );

  assert.equal(response.status, 403);
  assert.equal(cookieSet, false);
  assert.deepEqual(await response.json(), { error: '업주 계정은 사장님 로그인에서 로그인해 주세요.' });
});

test('handleLoginPost rejects regular users from the owner login audience', async () => {
  let cookieSet = false;
  const response = await handleLoginPost(
    new Request('https://example.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'user@example.com', password: 'secret', audience: 'owner' }),
    }),
    {
      checkRateLimit: () => ({
        limited: false,
        headers: new Headers({
          'Cache-Control': 'no-store',
        }),
      }),
      login: async () => ({
        token: 'user-token',
        user: { id: 'user-1', email: 'user@example.com', role: 'USER' },
      }),
      setSessionCookie: async () => {
        cookieSet = true;
      },
    },
  );

  assert.equal(response.status, 403);
  assert.equal(cookieSet, false);
  assert.deepEqual(await response.json(), { error: '일반 회원 계정은 일반 고객 로그인에서 로그인해 주세요.' });
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
test('handleUserRegisterPost rejects whitespace-only required fields', async () => {
  const response = await handleUserRegisterPost(
    new Request('https://example.com/api/auth/register/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: '   ', email: 'user@example.com', password: 'secret123' }),
    }),
    {
      checkRateLimit: () => ({
        limited: false,
        headers: new Headers({
          'Cache-Control': 'no-store',
        }),
      }),
      registerUser: async () => {
        throw new Error('registerUser should not be called');
      },
    },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: '필수 입력값이 누락되었습니다.' });
});

test('handleUserRegisterPost trims display name and email before storing', async () => {
  const response = await handleUserRegisterPost(
    new Request('https://example.com/api/auth/register/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: '  홍길동  ', email: ' User@Example.com ', password: ' secret123 ' }),
    }),
    {
      checkRateLimit: () => ({
        limited: false,
        headers: new Headers(),
      }),
      registerUser: async (input) => {
        assert.deepEqual(input, {
          name: '홍길동',
          email: 'User@Example.com',
          password: ' secret123 ',
        });
        return { id: 'user-1', ...input };
      },
    },
  );

  assert.equal(response.status, 201);
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
