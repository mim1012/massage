import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleLoginPost } from '@/app/api/auth/login/post';
import { handleOwnerRegisterPost } from '@/app/api/auth/register/owner/post';
import { handleUserRegisterPost } from '@/app/api/auth/register/user/post';

test('handleLoginPost checks IP and credential limits before successful responses', async () => {
  const observedCalls: Array<{ routeKey: string; credential?: string }> = [];

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
        observedCalls.push({ routeKey, credential: options?.credential });
        return {
          limited: false,
          headers: new Headers({
            'Cache-Control': 'no-store',
            'X-RateLimit-Limit': routeKey === 'auth:login:credential' ? '5' : '30',
            'X-RateLimit-Remaining': routeKey === 'auth:login:credential' ? '4' : '29',
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

  assert.deepEqual(observedCalls, [
    { routeKey: 'auth:login:ip', credential: undefined },
    { routeKey: 'auth:login:credential', credential: ' User@Example.com ' },
  ]);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-RateLimit-Limit'), '5');
  assert.equal(response.headers.get('X-RateLimit-Remaining'), '4');
  assert.deepEqual(await response.json(), {
    user: { id: 'user-1', email: 'user@example.com', role: 'USER' },
  });
});

test('handleLoginPost returns the IP limiter response before parsing the body when blocked', async () => {
  const response = await handleLoginPost(
    new Request('https://example.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"email":',
    }),
    {
      checkRateLimit: (_request, routeKey) => {
        assert.equal(routeKey, 'auth:login:ip');
        return {
          limited: true,
          response: Response.json({ error: 'blocked' }, { status: 429 }),
        };
      },
      login: async () => {
        throw new Error('login should not be called');
      },
    },
  );

  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: 'blocked' });
});

test('handleLoginPost preserves IP limiter headers when request JSON is malformed', async () => {
  const response = await handleLoginPost(
    new Request('https://example.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"email":',
    }),
    {
      checkRateLimit: (_request, routeKey) => {
        assert.equal(routeKey, 'auth:login:ip');
        return {
          limited: false,
          headers: new Headers({
            'Cache-Control': 'no-store',
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '29',
          }),
        };
      },
      login: async () => {
        throw new Error('login should not be called');
      },
    },
  );

  assert.equal(response.status, 400);
  assert.equal(response.headers.get('X-RateLimit-Limit'), '30');
  assert.equal(response.headers.get('X-RateLimit-Remaining'), '29');
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
      checkRateLimit: (_request, routeKey) => ({
        limited: false,
        headers: new Headers({
          'Cache-Control': 'no-store',
          'X-RateLimit-Limit': routeKey === 'auth:login:credential' ? '5' : '30',
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
      checkRateLimit: (_request, routeKey) => ({
        limited: false,
        headers: new Headers({
          'Cache-Control': 'no-store',
          'X-RateLimit-Limit': routeKey === 'auth:login:credential' ? '5' : '30',
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
      checkRateLimit: (_request, routeKey) => ({
        limited: false,
        headers: new Headers({
          'Cache-Control': 'no-store',
          'X-RateLimit-Limit': routeKey === 'auth:login:credential' ? '5' : '30',
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

test('handleUserRegisterPost maps database failures to a 503 service error response', async () => {
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
        }),
      }),
      registerUser: async () => {
        throw new Error('DATABASE_ERROR');
      },
    },
  );

  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), {
    error: '데이터베이스 연결에 실패했습니다. 관리자에게 문의해 주세요.',
  });
});

test('handleUserRegisterPost maps duplicate emails to a 409 conflict response', async () => {
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
          'X-RateLimit-Remaining': '6',
        }),
      }),
      registerUser: async () => {
        throw new Error('EMAIL_IN_USE');
      },
    },
  );

  assert.equal(response.status, 409);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-RateLimit-Remaining'), '6');
  assert.deepEqual(await response.json(), { error: '이미 사용 중인 이메일입니다.' });
});

test('handleUserRegisterPost preserves rate-limit headers when the request body is malformed', async () => {
  const response = await handleUserRegisterPost(
    new Request('https://example.com/api/auth/register/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"name":',
    }),
    {
      checkRateLimit: () => ({
        limited: false,
        headers: new Headers({
          'Cache-Control': 'no-store',
          'X-RateLimit-Limit': '10',
        }),
      }),
    },
  );

  assert.equal(response.status, 400);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-RateLimit-Limit'), '10');
  assert.deepEqual(await response.json(), { error: 'Unexpected end of JSON input' });
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

test('handleOwnerRegisterPost maps duplicate emails to a 409 conflict response', async () => {
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
          'X-RateLimit-Remaining': '5',
        }),
      }),
      registerOwnerRoute: async () => Response.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 }),
      registerOwner: async () => {
        throw new Error('EMAIL_IN_USE');
      },
    },
  );

  assert.equal(response.status, 409);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-RateLimit-Remaining'), '5');
  assert.deepEqual(await response.json(), { error: '이미 사용 중인 이메일입니다.' });
});

test('handleOwnerRegisterPost preserves rate-limit headers when the request body is malformed', async () => {
  const response = await handleOwnerRegisterPost(
    new Request('https://example.com/api/auth/register/owner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"name":',
    }),
    {
      checkRateLimit: () => ({
        limited: false,
        headers: new Headers({
          'Cache-Control': 'no-store',
          'X-RateLimit-Limit': '10',
        }),
      }),
    },
  );

  assert.equal(response.status, 400);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-RateLimit-Limit'), '10');
  assert.deepEqual(await response.json(), { error: 'Unexpected end of JSON input' });
});
